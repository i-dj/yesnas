'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronsUpDown, Database, Folder, FolderOpen, Loader2, Plus } from 'lucide-react'
import { getFileApiHost, getStorageFilesUrl } from '@/lib/file-api'
import { bytesFormat, cn } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import type { StoragePoolModel } from '@/types/models/storage'
import { Input } from './input'

export interface StorageLocationValue {
  storagePoolId: string
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

interface StorageLocationPickerProps {
  storagePools: StoragePoolModel[]
  value: StorageLocationValue
  onChange: (value: StorageLocationValue) => void
  placeholder?: string
  allowCreateFolder?: boolean
  onError?: (message: string | null) => void
  className?: string
  labels?: Partial<{
    close: string
    loadingFolders: string
    noFolders: string
    newFolderName: string
    createFolderFailed: string
    folderCreated: string
  }>
}

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

export const getPoolStorageId = (pool: StoragePoolModel) => pool.storageId || pool.id

const findPoolByTargetId = (pools: StoragePoolModel[], id: string) =>
  pools.find((pool) => pool.id === id || getPoolStorageId(pool) === id)

const getPoolAvailableBytes = (pool: StoragePoolModel) => {
  if (pool.totalBytes > 0 && pool.usedBytes >= 0) {
    return Math.max(pool.totalBytes - pool.usedBytes, 0)
  }
  return pool.freeBytes ?? 0
}

export function StorageLocationPicker({
  storagePools,
  value,
  onChange,
  placeholder = 'Select location',
  allowCreateFolder = false,
  onError,
  className,
  labels,
}: StorageLocationPickerProps) {
  const [open, setOpen] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null)
  const [nodes, setNodes] = useState<FolderNode[]>([])
  const [createParentId, setCreateParentId] = useState<string | null>(null)
  const [createName, setCreateName] = useState('')

  const selectedPool = useMemo(
    () => findPoolByTargetId(storagePools, value.storagePoolId),
    [storagePools, value.storagePoolId],
  )
  const selectedStorageId = selectedPool ? getPoolStorageId(selectedPool) : value.storagePoolId
  const displayText = selectedPool
    ? value.pathNames.length > 0
      ? `${selectedPool.name}/${value.pathNames.join('/')}`
      : `${selectedPool.name}/`
    : placeholder

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
      const data = (await res.json()) as { files?: Array<{ id: string; name: string; type: string }> }
      return (data.files ?? [])
        .filter((file) => file.type === 'folder' && file.name !== '.uploads' && !String(file.name).startsWith('.'))
        .map((file) => ({ id: file.id, name: file.name }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load folders'
      const isMissingStorageNode =
        message.includes('存储节点不存在') || message.toLowerCase().includes('storage node not found')
      if (isMissingStorageNode) {
        onError?.(null)
        onChange({ storagePoolId: '', folderId: '', pathNames: [] })
        return []
      }
      onError?.(message)
      toast.error(labels?.loadingFolders || 'Load folders failed', message, 4500)
      return []
    }
  }

  const buildPath = (input: FolderNode[], id: string) => {
    const byId = new Map(input.map((item) => [item.id, item]))
    const list: Array<{ id: string; name: string }> = []
    let current = byId.get(id)
    while (current) {
      list.unshift({ id: current.id, name: current.name })
      current = current.parentId ? byId.get(current.parentId) : undefined
    }
    return list
  }

  const hydrateByPath = async (storageId: string, pathNames: string[]) => {
    const root = await loadFolders(storageId)
    let result: FolderNode[] = root.map((folder) => ({
      ...folder,
      parentId: '',
      depth: 0,
      loaded: false,
      expanded: false,
    }))
    let parentId = ''
    let selectedId = ''

    for (const segment of pathNames) {
      const current = result.find((node) => node.parentId === parentId && node.name === segment)
      if (!current) break
      selectedId = current.id
      const children = await loadFolders(storageId, current.id)
      const index = result.findIndex((node) => node.id === current.id)
      const mapped = children.map((folder) => ({
        ...folder,
        parentId: current.id,
        depth: current.depth + 1,
        loaded: false,
        expanded: false,
      }))
      result = [
        ...result.slice(0, index),
        { ...current, loaded: true, expanded: true },
        ...mapped,
        ...result.slice(index + 1),
      ]
      parentId = current.id
    }

    return { nodes: result, selectedId }
  }

  const openPool = async (pool: StoragePoolModel) => {
    const storageId = getPoolStorageId(pool)
    onChange({ storagePoolId: pool.id, folderId: '', pathNames: [] })
    setLoadingFolders(true)
    const root = await loadFolders(storageId)
    setNodes(
      root.map((folder) => ({
        ...folder,
        parentId: '',
        depth: 0,
        loaded: false,
        expanded: false,
      })),
    )
    setLoadingFolders(false)
  }

  const toggleNode = async (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId)
    if (!node || !selectedStorageId) return
    if (node.expanded) {
      setNodes((current) => {
        const index = current.findIndex((item) => item.id === nodeId)
        if (index < 0) return current
        let end = index + 1
        while (end < current.length && current[end].depth > node.depth) end += 1
        return [...current.slice(0, index), { ...node, loaded: false, expanded: false }, ...current.slice(end)]
      })
      return
    }
    if (node.loaded) {
      setNodes((current) => current.map((item) => (item.id === nodeId ? { ...item, expanded: true } : item)))
      return
    }
    setLoadingNodeId(nodeId)
    const children = await loadFolders(selectedStorageId, nodeId)
    setLoadingNodeId(null)
    setNodes((current) => {
      const index = current.findIndex((item) => item.id === nodeId)
      const mapped = children.map((folder) => ({
        ...folder,
        parentId: nodeId,
        depth: node.depth + 1,
        loaded: false,
        expanded: false,
      }))
      return [
        ...current.slice(0, index),
        { ...node, loaded: true, expanded: true },
        ...mapped,
        ...current.slice(index + 1),
      ]
    })
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
      const pool = findPoolByTargetId(storagePools, storageId)
      setCreateParentId(null)
      setCreateName('')
      if (pool) await openPool(pool)
      if (created.id) {
        onChange({
          storagePoolId: pool?.id || storageId,
          folderId: created.id,
          pathNames: [...fallback.map((item) => item.name), createdName],
        })
      }
      toast.success(labels?.folderCreated || 'Folder created', `${createdName} created successfully.`)
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create folder'
      onError?.(message)
      toast.error(labels?.createFolderFailed || 'Create folder failed', message, 5000)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={async () => {
          if (preparing) return
          const currentPool = selectedPool
          const fallbackPool = storagePools[0]
          const pool = currentPool || fallbackPool
          if (!pool) return

          if (!currentPool) {
            onChange({ storagePoolId: pool.id, folderId: '', pathNames: [] })
          }

          setPreparing(true)
          setLoadingFolders(true)
          const hydrated = await hydrateByPath(getPoolStorageId(pool), currentPool ? value.pathNames : [])
          setNodes(hydrated.nodes)
          if (hydrated.selectedId) {
            onChange({ storagePoolId: pool.id, folderId: hydrated.selectedId, pathNames: value.pathNames })
          }
          setLoadingFolders(false)
          setPreparing(false)
          setOpen(true)
        }}
        className="bg-app-bg border-app-border text-app-text hover:border-app-border-strong flex h-9 w-full min-w-0 items-center justify-between rounded-md border px-2 text-xs"
      >
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Database className="text-app-text-muted h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{shortenMiddle(displayText)}</span>
        </span>
        {preparing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronsUpDown className="h-3.5 w-3.5" />}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={labels?.close || 'Close location picker'}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] cursor-default"
          />
          <div className="bg-app-bg border-app-border absolute top-[calc(100%+8px)] left-0 z-[61] w-full rounded-lg border shadow-xl">
            <div className="max-h-72 overflow-y-auto rounded-md p-1">
              {storagePools.map((pool) => {
                const storageId = getPoolStorageId(pool)
                const expanded = selectedPool?.id === pool.id
                return (
                  <div key={pool.id} className="mb-1">
                    <div className="group hover:bg-app-hover/35 flex cursor-pointer items-center gap-1 rounded px-1 py-0.5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (expanded) {
                            onChange({ storagePoolId: '', folderId: '', pathNames: [] })
                            setNodes([])
                            return
                          }
                          void openPool(pool)
                        }}
                        className="text-app-text-muted hover:text-app-text hover:border-app-border hover:bg-app-bg inline-flex h-5 w-5 items-center justify-center rounded-sm border border-transparent transition-colors"
                      >
                        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </button>
                      <Database className="text-app-text-muted h-3.5 w-3.5" />
                      <button
                        type="button"
                        onClick={() => {
                          onChange({ storagePoolId: pool.id, folderId: '', pathNames: [] })
                          setOpen(false)
                        }}
                        className="text-app-text h-7 flex-1 cursor-pointer rounded px-1.5 text-left text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span>{pool.name}</span>
                          <span className="text-app-text-muted text-[11px]">
                            {bytesFormat(getPoolAvailableBytes(pool), { standard: 'm', decimalPlaces: 2 })}
                          </span>
                        </span>
                      </button>
                      {allowCreateFolder && expanded ? (
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
                            {labels?.loadingFolders || 'Loading folders...'}
                          </div>
                        ) : nodes.length === 0 ? (
                          <div className="text-app-text-muted px-2.5 py-2 text-xs">
                            {labels?.noFolders || 'No folders'}
                          </div>
                        ) : (
                          nodes.map((folder) => {
                            const path = buildPath(nodes, folder.id)
                            const selected = value.folderId === folder.id
                            return (
                              <div
                                key={folder.id}
                                data-folder-id={folder.id}
                                className={selected ? 'bg-app-hover/35 rounded' : 'hover:bg-app-hover/35 rounded'}
                              >
                                <div
                                  className="group flex items-center gap-1 px-1 py-0.5"
                                  style={{ paddingLeft: `${8 + folder.depth * 18}px` }}
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
                                  <button
                                    type="button"
                                    className="text-app-text h-7 min-w-0 flex-1 truncate rounded px-1.5 text-left text-sm"
                                    onClick={() => {
                                      onChange({
                                        storagePoolId: pool.id,
                                        folderId: folder.id,
                                        pathNames: path.map((item) => item.name),
                                      })
                                      setOpen(false)
                                    }}
                                  >
                                    {folder.name}
                                  </button>
                                  {allowCreateFolder ? (
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
                                  ) : null}
                                </div>
                                {allowCreateFolder && createParentId === folder.id ? (
                                  <CreateFolderInput
                                    value={createName}
                                    indent={28 + (folder.depth + 1) * 18}
                                    placeholder={labels?.newFolderName || 'New folder name'}
                                    onChange={setCreateName}
                                    onCancel={() => {
                                      setCreateParentId(null)
                                      setCreateName('')
                                    }}
                                    onSubmit={() => confirmCreate(storageId, folder.id, path)}
                                  />
                                ) : null}
                              </div>
                            )
                          })
                        )}
                        {allowCreateFolder && createParentId === '' ? (
                          <CreateFolderInput
                            value={createName}
                            indent={8}
                            placeholder={labels?.newFolderName || 'New folder name'}
                            onChange={setCreateName}
                            onCancel={() => {
                              setCreateParentId(null)
                              setCreateName('')
                            }}
                            onSubmit={() => confirmCreate(storageId, '', [])}
                          />
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
  )
}

function CreateFolderInput({
  value,
  indent,
  placeholder,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: string
  indent: number
  placeholder: string
  onChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <div className="px-1 py-1" style={{ paddingLeft: `${indent}px` }} onClick={(event) => event.stopPropagation()}>
      <div className="relative">
        <Input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-7 pr-8 text-xs"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            event.stopPropagation()
            if (event.nativeEvent.isComposing) return
            if (event.key === 'Escape') {
              onCancel()
              return
            }
            if (event.key !== 'Enter') return
            onSubmit()
          }}
        />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSubmit()
          }}
          className="text-app-text-muted hover:text-app-text absolute top-1/2 right-1 -translate-y-1/2 rounded p-1"
        >
          ✓
        </button>
      </div>
    </div>
  )
}
