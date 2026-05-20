'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronsUpDown, Database, Folder, FolderOpen, Loader2, Plus } from 'lucide-react'
import { getFileApiHost, getStorageFilesUrl } from '@/lib/file-api'
import type { StoragePoolModel } from '@/types/models/storage'
import { bytesFormat } from '@/lib/utils'
import { Button } from './button'
import { Input } from './input'
import { toast } from '@/store/use-toast-store'

export interface UploadTargetValue {
  storageId: string
  folderId: string
  pathNames: string[]
}

interface FolderNode {
  id: string
  name: string
  parentId: string
  depth: number
  loaded: boolean
  expanded: boolean
}

interface UploadTargetDropdownProps {
  storagePools: StoragePoolModel[]
  value: UploadTargetValue
  onChange: (value: UploadTargetValue) => void
  onError?: (message: string | null) => void
}

const DEFAULT_UPLOAD_TARGET_KEY = 'yesnas.upload.default-target'

const parseApiErrorMessage = (raw: string, fallback: string) => {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as { message?: string; error?: string }
    return parsed.message || parsed.error || raw
  } catch {
    return raw
  }
}

const shortenMiddle = (value: string, max = 42) => {
  if (value.length <= max) return value
  const side = Math.floor((max - 3) / 2)
  return `${value.slice(0, side)}...${value.slice(-side)}`
}

const getPoolStorageId = (pool: StoragePoolModel) => pool.storageId || pool.id

const findPoolByTargetId = (pools: StoragePoolModel[], id: string) =>
  pools.find((pool) => pool.id === id || getPoolStorageId(pool) === id)

export function UploadTargetDropdown({ storagePools, value, onChange, onError }: UploadTargetDropdownProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [preparingPicker, setPreparingPicker] = useState(false)
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null)
  const [nodes, setNodes] = useState<FolderNode[]>([])
  const [createParentId, setCreateParentId] = useState<string | null>(null)
  const [createName, setCreateName] = useState('')
  const treeListRef = useRef<HTMLDivElement | null>(null)

  const selectedPool = useMemo(() => findPoolByTargetId(storagePools, value.storageId), [storagePools, value.storageId])
  const selectedStorageId = selectedPool ? getPoolStorageId(selectedPool) : value.storageId

  const targetText = selectedPool
    ? value.pathNames.length > 0
      ? `${selectedPool.name}/${value.pathNames.join('/')}`
      : `${selectedPool.name}/`
    : ''
  const displayTargetText = targetText ? shortenMiddle(targetText) : 'Please select upload target'

  const defaultRawRef = useRef<UploadTargetValue | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DEFAULT_UPLOAD_TARGET_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as UploadTargetValue
      if (!parsed?.storageId) return
      defaultRawRef.current = parsed
      onChange(parsed)
    } catch {
      defaultRawRef.current = null
    }
  }, [onChange])

  useEffect(() => {
    if (!value.storageId) return
    if (storagePools.length === 0) return
    const pool = findPoolByTargetId(storagePools, value.storageId)
    if (pool) {
      const storageId = getPoolStorageId(pool)
      if (storageId !== value.storageId) {
        if (defaultRawRef.current?.storageId === value.storageId) {
          const normalizedDefault = {
            ...defaultRawRef.current,
            storageId,
          }
          defaultRawRef.current = normalizedDefault
          window.localStorage.setItem(DEFAULT_UPLOAD_TARGET_KEY, JSON.stringify(normalizedDefault))
        }
        onChange({
          storageId,
          folderId: value.folderId,
          pathNames: value.pathNames,
        })
      }
      return
    }
    onError?.(null)
    onChange({ storageId: '', folderId: '', pathNames: [] })
  }, [onChange, onError, storagePools, value.folderId, value.pathNames, value.storageId])

  const isSameAsDefault =
    defaultRawRef.current?.storageId === selectedStorageId &&
    (defaultRawRef.current?.folderId || '') === (value.folderId || '')
  const canSetDefault = Boolean(selectedStorageId) && !isSameAsDefault

  const buildPath = (input: FolderNode[], id: string) => {
    const byId = new Map(input.map((item) => [item.id, item]))
    const list: Array<{ id: string; name: string }> = []
    let current = byId.get(id)
    while (current) {
      list.unshift({ id: current.id, name: current.name })
      if (!current.parentId) break
      current = byId.get(current.parentId)
    }
    return list
  }

  const loadFolders = async (storageId: string, parentId = '') => {
    try {
      onError?.(null)
      const params = new URLSearchParams()
      if (parentId) params.set('parentId', parentId)
      const res = await fetch(getStorageFilesUrl(storageId, params))
      if (!res.ok) {
        const text = await res.text()
        throw new Error(parseApiErrorMessage(text, `Load folders failed: ${res.status}`))
      }
      const data = (await res.json()) as {
        files?: Array<{ id: string; name: string; type: string }>
      }
      return (data.files ?? [])
        .filter((f) => f.type === 'folder' && f.name !== '.uploads' && !String(f.name).startsWith('.'))
        .map((f) => ({ id: f.id, name: f.name }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load folders'
      const isMissingStorageNode =
        message.includes('存储节点不存在') || message.toLowerCase().includes('storage node not found')
      if (isMissingStorageNode) {
        onError?.(null)
        onChange({ storageId: '', folderId: '', pathNames: [] })
        return []
      }
      onError?.(message)
      toast.error('Load folders failed', message, 4500)
      return []
    }
  }

  const hydrateByPath = async (storageId: string, pathNames: string[]) => {
    const root = await loadFolders(storageId)
    let result: FolderNode[] = root.map((f) => ({
      ...f,
      parentId: '',
      depth: 0,
      loaded: false,
      expanded: false,
    }))
    let parentId = ''
    let selectedId = ''
    for (const segment of pathNames) {
      const candidates = parentId ? result.filter((n) => n.parentId === parentId) : result.filter((n) => n.depth === 0)
      const current = candidates.find((n) => n.name === segment)
      if (!current) break
      selectedId = current.id
      result = result.map((n) => (n.id === current.id ? { ...n, loaded: true, expanded: true } : n))
      const children = await loadFolders(storageId, current.id)
      const parentIndex = result.findIndex((n) => n.id === current.id)
      let end = parentIndex + 1
      while (end < result.length && result[end].depth > current.depth) end += 1
      const mapped = children.map((f) => ({
        ...f,
        parentId: current.id,
        depth: current.depth + 1,
        loaded: false,
        expanded: false,
      }))
      result = [...result.slice(0, parentIndex + 1), ...mapped, ...result.slice(end)]
      parentId = current.id
    }
    return { nodes: result, selectedId }
  }

  const openPool = async (storageId: string) => {
    onChange({ storageId, folderId: '', pathNames: [] })
    setLoadingFolders(true)
    const root = await loadFolders(storageId)
    setNodes(
      root.map((f) => ({
        ...f,
        parentId: '',
        depth: 0,
        loaded: false,
        expanded: false,
      })),
    )
    setLoadingFolders(false)
  }

  const expandNode = async (nodeId: string) => {
    const current = nodes.find((n) => n.id === nodeId)
    if (!current || !selectedStorageId) return
    if (current.loaded) {
      setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, expanded: true } : n)))
      return
    }
    setLoadingNodeId(nodeId)
    const children = await loadFolders(selectedStorageId, nodeId)
    setLoadingNodeId(null)
    setNodes((prev) => {
      const parentIndex = prev.findIndex((n) => n.id === nodeId)
      if (parentIndex < 0) return prev
      const parent = prev[parentIndex]
      let end = parentIndex + 1
      while (end < prev.length && prev[end].depth > parent.depth) end += 1
      const mapped = children.map((f) => ({
        ...f,
        parentId: nodeId,
        depth: parent.depth + 1,
        loaded: false,
        expanded: false,
      }))
      return [...prev.slice(0, parentIndex), { ...parent, loaded: true, expanded: true }, ...mapped, ...prev.slice(end)]
    })
  }

  const collapseNode = (nodeId: string) => {
    setNodes((prev) => {
      const index = prev.findIndex((n) => n.id === nodeId)
      if (index < 0) return prev
      const depth = prev[index].depth
      let end = index + 1
      while (end < prev.length && prev[end].depth > depth) end += 1
      return [...prev.slice(0, index), { ...prev[index], expanded: false }, ...prev.slice(end)]
    })
  }

  const toggleNode = async (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    if (node.expanded) {
      collapseNode(nodeId)
      return
    }
    await expandNode(nodeId)
  }

  const confirmCreate = async (storageId: string, parentId: string, fallback: Array<{ id: string; name: string }>) => {
    const name = createName.trim()
    if (!name) return
    try {
      onError?.(null)
      const res = await fetch(`${getFileApiHost()}/storages/${storageId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(parseApiErrorMessage(text, `Create folder failed: ${res.status}`))
      }
      const created = (await res.json()) as { id?: string; name?: string }
      const createdName = created.name || name
      setCreateParentId(null)
      setCreateName('')
      await openPool(storageId)
      if (created.id) {
        onChange({
          storageId,
          folderId: created.id,
          pathNames: [...fallback.map((v) => v.name), createdName],
        })
      }
      toast.success('Folder created', `${createdName} created successfully.`)
      setPickerOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create folder'
      onError?.(message)
      toast.error('Create folder failed', message, 5000)
    }
  }

  useEffect(() => {
    if (!pickerOpen || !value.folderId) return
    const timer = window.setTimeout(() => {
      const wrap = treeListRef.current
      if (!wrap) return
      const item = wrap.querySelector<HTMLElement>(`[data-folder-id="${value.folderId}"]`)
      item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [nodes, pickerOpen, value.folderId])

  return (
    <div className="bg-app-bg">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-app-text mb-2 text-xs font-semibold uppercase">Upload Target</span>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={async () => {
            if (preparingPicker) return
            if (!value.storageId && storagePools.length > 0) {
              onChange({
                storageId: getPoolStorageId(storagePools[0]),
                folderId: '',
                pathNames: [],
              })
            }
            const currentPool = findPoolByTargetId(storagePools, value.storageId)
            const fallbackPool = storagePools[0]
            const sid = currentPool ? getPoolStorageId(currentPool) : fallbackPool ? getPoolStorageId(fallbackPool) : ''
            if (!sid) return
            if (!currentPool && value.storageId) {
              onChange({ storageId: sid, folderId: '', pathNames: [] })
            }
            setPreparingPicker(true)
            setLoadingFolders(true)
            const path = value.pathNames.length > 0 ? value.pathNames : []
            const hydrated = await hydrateByPath(sid, path)
            setNodes(hydrated.nodes)
            if (hydrated.selectedId) {
              onChange({
                storageId: sid,
                folderId: hydrated.selectedId,
                pathNames: path,
              })
            }
            setLoadingFolders(false)
            setPreparingPicker(false)
            setPickerOpen(true)
          }}
          className="bg-app-bg border-app-border text-app-text hover:border-app-border-strong flex h-9 min-w-0 flex-1 items-center justify-between rounded-md border px-2 text-xs"
        >
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Database className="text-app-text-muted h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{displayTargetText}</span>
          </span>
          {preparingPicker ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5" />
          )}
        </button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-9"
          disabled={!canSetDefault}
          onClick={() => {
            if (!canSetDefault) return
            const payload: UploadTargetValue = {
              storageId: selectedStorageId,
              folderId: value.folderId,
              pathNames: value.pathNames,
            }
            window.localStorage.setItem(DEFAULT_UPLOAD_TARGET_KEY, JSON.stringify(payload))
            defaultRawRef.current = payload
          }}
        >
          Set Default
        </Button>

        {pickerOpen ? (
          <>
            <button
              type="button"
              aria-label="Close target picker"
              onClick={() => setPickerOpen(false)}
              className="fixed inset-0 z-[60] cursor-default"
            />
            <div className="bg-app-bg border-app-border absolute top-[calc(100%+8px)] left-0 z-[61] w-full rounded-lg border shadow-xl">
              <div ref={treeListRef} className="max-h-72 overflow-y-auto rounded-md p-1">
                {storagePools.map((pool) => {
                  const poolStorageId = getPoolStorageId(pool)
                  const expanded = selectedPool?.id === pool.id
                  return (
                    <div key={pool.id} className="mb-1">
                      <div className="group flex items-center gap-1 px-1 py-0.5">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            if (expanded) {
                              onChange({
                                storageId: '',
                                folderId: '',
                                pathNames: [],
                              })
                              setNodes([])
                              return
                            }
                            void openPool(poolStorageId)
                          }}
                          className="text-app-text-muted hover:text-app-text hover:border-app-border hover:bg-app-bg inline-flex h-5 w-5 items-center justify-center rounded-sm border border-transparent transition-colors"
                        >
                          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>
                        <Database className="text-app-text-muted h-3.5 w-3.5" />
                        <button
                          type="button"
                          onClick={() => {
                            onChange({
                              storageId: poolStorageId,
                              folderId: '',
                              pathNames: [],
                            })
                            setPickerOpen(false)
                          }}
                          className="text-app-text h-7 flex-1 rounded px-1.5 text-left text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <span>{pool.name}</span>
                            <span className="text-app-text-muted text-[11px]">
                              {bytesFormat(pool.freeBytes ?? 0, {
                                standard: 'm',
                                decimalPlaces: 2,
                              })}{' '}
                              /{' '}
                              {bytesFormat(pool.totalBytes ?? 0, {
                                standard: 'm',
                                decimalPlaces: 0,
                              })}
                            </span>
                          </span>
                        </button>
                        {expanded ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setCreateParentId('')
                              setCreateName('')
                            }}
                            className="text-app-text-muted hover:text-app-text invisible ml-auto rounded p-1 group-hover:visible"
                            aria-label={`Create folder in ${pool.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>

                      {expanded ? (
                        <div className="ml-5">
                          {loadingFolders ? (
                            <div className="text-app-text-muted flex items-center gap-2 px-2.5 py-2 text-xs">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Loading folders...
                            </div>
                          ) : nodes.length === 0 ? (
                            <div className="text-app-text-muted px-2.5 py-2 text-xs">No folders</div>
                          ) : (
                            nodes.map((folder) => {
                              const selected = value.folderId === folder.id
                              const path = buildPath(nodes, folder.id)
                              return (
                                <div
                                  key={folder.id}
                                  data-folder-id={folder.id}
                                  className={selected ? 'bg-app-hover/35 rounded' : 'hover:bg-app-hover/35 rounded'}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    onChange({
                                      storageId: poolStorageId,
                                      folderId: folder.id,
                                      pathNames: path.map((item) => item.name),
                                    })
                                    setPickerOpen(false)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.nativeEvent.isComposing) return
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      onChange({
                                        storageId: poolStorageId,
                                        folderId: folder.id,
                                        pathNames: path.map((item) => item.name),
                                      })
                                      setPickerOpen(false)
                                    }
                                  }}
                                >
                                  <div
                                    className="group flex items-center gap-1 px-1 py-0.5"
                                    style={{
                                      paddingLeft: `${8 + folder.depth * 18}px`,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        void toggleNode(folder.id)
                                      }}
                                      className="text-app-text-muted hover:text-app-text hover:border-app-border hover:bg-app-bg inline-flex h-5 w-5 items-center justify-center rounded-sm border border-transparent transition-colors"
                                    >
                                      {loadingNodeId === folder.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : folder.expanded ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                    </button>
                                    {folder.expanded ? (
                                      <FolderOpen className="text-app-text-muted h-3.5 w-3.5" />
                                    ) : (
                                      <Folder className="text-app-text-muted h-3.5 w-3.5" />
                                    )}
                                    <div className="text-app-text h-7 max-w-[72%] rounded px-1.5 text-left text-sm leading-7">
                                      {folder.name}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        setCreateParentId(folder.id)
                                        setCreateName('')
                                      }}
                                      className="text-app-text-muted hover:text-app-text invisible ml-auto rounded p-1 group-hover:visible"
                                      aria-label={`Create subfolder under ${folder.name}`}
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  {createParentId === folder.id ? (
                                    <div
                                      onClick={(event) => event.stopPropagation()}
                                      className="px-1 py-1"
                                      style={{
                                        paddingLeft: `${28 + (folder.depth + 1) * 18}px`,
                                      }}
                                    >
                                      <div className="relative">
                                        <Input
                                          autoFocus
                                          value={createName}
                                          onChange={(e) => setCreateName(e.target.value)}
                                          placeholder="New folder name"
                                          className="h-7 pr-8 text-xs"
                                          onClick={(event) => event.stopPropagation()}
                                          onKeyDown={async (event) => {
                                            event.stopPropagation()
                                            if (event.nativeEvent.isComposing) return
                                            if (event.key === 'Escape') {
                                              setCreateParentId(null)
                                              setCreateName('')
                                              return
                                            }
                                            if (event.key !== 'Enter') return
                                            await confirmCreate(poolStorageId, folder.id, path)
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onClick={async (event) => {
                                            event.stopPropagation()
                                            await confirmCreate(poolStorageId, folder.id, path)
                                          }}
                                          className="text-app-text-muted hover:text-app-text absolute top-1/2 right-1 -translate-y-1/2 rounded p-1"
                                        >
                                          ✓
                                        </button>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              )
                            })
                          )}
                          {createParentId === '' ? (
                            <div className="px-2 py-1" onClick={(event) => event.stopPropagation()}>
                              <div className="relative">
                                <Input
                                  autoFocus
                                  value={createName}
                                  onChange={(e) => setCreateName(e.target.value)}
                                  placeholder="New folder name"
                                  className="h-7 pr-8 text-xs"
                                  onClick={(event) => event.stopPropagation()}
                                  onKeyDown={async (event) => {
                                    event.stopPropagation()
                                    if (event.nativeEvent.isComposing) return
                                    if (event.key === 'Escape') {
                                      setCreateParentId(null)
                                      setCreateName('')
                                      return
                                    }
                                    if (event.key !== 'Enter') return
                                    await confirmCreate(poolStorageId, '', [])
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={async (event) => {
                                    event.stopPropagation()
                                    await confirmCreate(poolStorageId, '', [])
                                  }}
                                  className="text-app-text-muted hover:text-app-text absolute top-1/2 right-1 -translate-y-1/2 rounded p-1"
                                >
                                  ✓
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
