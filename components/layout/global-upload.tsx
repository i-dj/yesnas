import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Upload, FolderUp, FileUp, X, AlertCircle, CheckCircle2, FileIcon, Image as ImageIcon } from 'lucide-react'
import { Button, EmptyState, UploadTargetDropdown, type UploadTargetValue } from '@/components/ui'
import { uppy } from '@/lib/uppy'
import { useUploadStore } from '@/store/use-upload-store'
import { toast } from '@/store/use-toast-store'
import { getFileConfig } from '@/lib/file-utils'
import { getStoragePoolsUrl } from '@/lib/file-api'
import type { StoragePoolModel } from '@/types/models/storage'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const getUploadIconMeta = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const config = getFileConfig(name)
  if (!ext || config.Icon === FileIcon) {
    return { Icon: ImageIcon, color: 'text-sky-500' }
  }
  return config
}

const formatStableBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = Math.max(0, bytes)
  let unitIndex = 0

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000
    unitIndex += 1
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const decodeFileIdPath = (id: string) => {
  if (!id || typeof window === 'undefined') return ''
  try {
    const normalized = id.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const binary = window.atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return ''
  }
}

const splitParentPathNames = (parentId: string, storageId: string, pool?: StoragePoolModel) => {
  const decodedPath = decodeFileIdPath(parentId)
  if (!decodedPath) return []

  const normalizedPath = decodedPath.replace(/\\/g, '/').replace(/\/+/g, '/')
  const prefixes = [pool?.dataPath, pool?.mountPath]
    .filter((item): item is string => Boolean(item))
    .map((item) => item.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, ''))

  const matchedPrefix = prefixes.find((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))
  if (matchedPrefix) {
    return normalizedPath.slice(matchedPrefix.length).split('/').filter(Boolean)
  }

  const parts = normalizedPath.split('/').filter(Boolean)
  const storageMarkerIndex = parts.findIndex((part) => part.includes(storageId))
  if (storageMarkerIndex >= 0) return parts.slice(storageMarkerIndex + 1)

  const dataIndex = parts.lastIndexOf('data')
  if (dataIndex >= 0) return parts.slice(dataIndex + 1)

  return parts
}

const normalizeUploadTarget = (value: UploadTargetValue, storagePools: StoragePoolModel[]): UploadTargetValue => {
  const pool = storagePools.find((item) => item.id === value.storagePoolId || item.storageId === value.storagePoolId)
  return pool ? { ...value, storagePoolId: pool.id } : value
}

export const GlobalUpload = ({ isOpen }: { isOpen: boolean }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [dragActive, setDragActive] = useState(false)
  const [storagePools, setStoragePools] = useState<StoragePoolModel[]>([])
  const [targetError, setTargetError] = useState<string | null>(null)
  const [target, setTarget] = useState<UploadTargetValue>({
    storagePoolId: '',
    folderId: '',
    pathNames: [],
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const storagePoolsRequestRef = useRef<Promise<StoragePoolModel[]> | null>(null)
  const refreshTimerRef = useRef<number | null>(null)
  const filesMap = useUploadStore((state) => state.files)
  const removeFile = useUploadStore((state) => state.removeFile)
  const clearCompleted = useUploadStore((state) => state.clearCompleted)

  const currentFileTarget = useMemo<UploadTargetValue | null>(() => {
    const match = pathname.match(/^\/file\/([^/]+)$/)
    if (!match?.[1]) return null
    const storageId = decodeURIComponent(match[1])
    const pool = storagePools.find((item) => item.id === storageId || item.storageId === storageId)
    const folderId = searchParams.get('parentId') || ''
    const pathNames = splitParentPathNames(folderId, storageId, pool)
    return {
      storagePoolId: pool?.id || storageId,
      folderId,
      pathNames,
    }
  }, [pathname, searchParams, storagePools])

  const currentFilePageKey = useMemo(() => {
    if (!currentFileTarget) return ''
    const query = searchParams.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [currentFileTarget, pathname, searchParams])

  useEffect(() => {
    if (!currentFileTarget) return
    setTarget((current) => {
      if (
        current.storagePoolId === currentFileTarget.storagePoolId &&
        current.folderId === currentFileTarget.folderId
      ) {
        return current
      }
      return currentFileTarget
    })
  }, [currentFileTarget])

  const recentFiles = useMemo(
    () => Object.values(filesMap).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()),
    [filesMap],
  )

  const totalBytes = useMemo(() => recentFiles.reduce((sum, file) => sum + (file.size || 0), 0), [recentFiles])

  const uploadedBytes = useMemo(
    () =>
      recentFiles.reduce(
        (sum, file) =>
          sum + (file.status === 'complete' ? file.size || 0 : Math.min(file.bytesUploaded || 0, file.size || 0)),
        0,
      ),
    [recentFiles],
  )

  const totalPercent = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0
  const hasUploadingFiles = recentFiles.some((file) => file.status === 'uploading')
  const hasFiles = recentFiles.length > 0
  const allCompleted = hasFiles && recentFiles.every((file) => file.status === 'complete')
  const batchStartAt = hasFiles ? Math.min(...recentFiles.map((file) => new Date(file.addedAt).getTime())) : null

  const [speedBytesPerSec, setSpeedBytesPerSec] = useState(0)
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null)
  const [batchCompletedAt, setBatchCompletedAt] = useState<number | null>(null)
  const speedSnapshotRef = useRef<{ bytes: number; at: number; speed: number }>({
    bytes: 0,
    at: Date.now(),
    speed: 0,
  })
  const uploadedBytesRef = useRef(uploadedBytes)
  const totalBytesRef = useRef(totalBytes)

  useEffect(() => {
    uploadedBytesRef.current = uploadedBytes
    totalBytesRef.current = totalBytes
  }, [totalBytes, uploadedBytes])

  useEffect(() => {
    if (!hasFiles || !allCompleted) {
      setBatchCompletedAt(null)
      return
    }
    setBatchCompletedAt((prev) => prev ?? Date.now())
  }, [allCompleted, hasFiles])

  useEffect(() => {
    if (!hasUploadingFiles) {
      setSpeedBytesPerSec(0)
      setEtaSeconds(null)
      speedSnapshotRef.current = {
        bytes: uploadedBytes,
        at: Date.now(),
        speed: 0,
      }
      return
    }

    speedSnapshotRef.current = {
      bytes: uploadedBytesRef.current,
      at: Date.now(),
      speed: speedSnapshotRef.current.speed,
    }

    const updateSpeed = () => {
      const now = Date.now()
      const prev = speedSnapshotRef.current
      const currentBytes = uploadedBytesRef.current
      const deltaBytes = Math.max(currentBytes - prev.bytes, 0)
      const deltaSec = Math.max((now - prev.at) / 1000, 0.5)
      const instantSpeed = deltaBytes / deltaSec
      const alpha = 0.14
      const speed = prev.speed > 0 ? prev.speed * (1 - alpha) + instantSpeed * alpha : instantSpeed
      const remain = Math.max(totalBytesRef.current - currentBytes, 0)

      setSpeedBytesPerSec(speed)
      setEtaSeconds(speed > 0 ? Math.ceil(remain / speed) : null)
      speedSnapshotRef.current = { bytes: currentBytes, at: now, speed }
    }

    updateSpeed()
    const timer = window.setInterval(updateSpeed, 1000)
    return () => window.clearInterval(timer)
  }, [hasUploadingFiles])

  const ensureStoragePoolsLoaded = useCallback(async () => {
    if (storagePools.length > 0) return storagePools
    if (storagePoolsRequestRef.current) return storagePoolsRequestRef.current

    const request = (async () => {
      try {
        setTargetError(null)
        const res = await fetch(getStoragePoolsUrl())
        if (!res.ok) throw new Error(`Load storage pools failed: ${res.status}`)
        const payload = (await res.json()) as StoragePoolModel[]
        setStoragePools(payload)
        return payload
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load storage pools'
        setTargetError(message)
        toast.error(`Load upload targets failed: ${message}`, 5000)
        return []
      } finally {
        storagePoolsRequestRef.current = null
      }
    })()

    storagePoolsRequestRef.current = request
    return request
  }, [storagePools])

  useEffect(() => {
    if (!currentFileTarget) return
    void ensureStoragePoolsLoaded()
  }, [currentFileTarget, ensureStoragePoolsLoaded])

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [currentFilePageKey, isOpen])

  useEffect(() => {
    const handleUploadSuccess = (file?: { meta?: Record<string, unknown> } | null) => {
      if (!isOpen || !currentFileTarget || !currentFilePageKey) return

      const meta = file?.meta ?? {}
      if (meta.uploadPageKey !== currentFilePageKey) return
      if (String(meta.storagePoolId ?? '') !== currentFileTarget.storagePoolId) return
      if (String(meta.parentId ?? '') !== currentFileTarget.folderId) return

      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current)
      }
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null
        router.refresh()
      }, 650)
    }

    uppy.on('upload-success', handleUploadSuccess)
    return () => {
      uppy.off('upload-success', handleUploadSuccess)
    }
  }, [currentFilePageKey, currentFileTarget, isOpen, router])

  const addFilesToUppy = (files: File[], uploadTarget: UploadTargetValue) => {
    for (const file of files) {
      try {
        uppy.addFile({
          name: file.name,
          type: file.type || 'application/octet-stream',
          data: file,
          source: 'global-upload',
          meta: {
            relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || '',
            storagePoolId: uploadTarget.storagePoolId,
            parentId: uploadTarget.folderId,
            uploadPageKey: currentFilePageKey,
          },
        })
      } catch (error) {
        console.warn('Add file to upload queue failed:', file.name, error)
      }
    }
  }

  const uploadFiles = async (files: File[]) => {
    const loadedStoragePools = await ensureStoragePoolsLoaded()
    const uploadTarget = normalizeUploadTarget(
      target.storagePoolId ? target : currentFileTarget || target,
      loadedStoragePools,
    )
    if (!uploadTarget.storagePoolId) {
      toast.error('Upload failed: Please select upload target.')
      return
    }
    addFilesToUppy(files, uploadTarget)
  }

  const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? [])
    if (picked.length > 0) {
      void uploadFiles(picked)
    }
    event.target.value = ''
  }

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    const dropped = Array.from(event.dataTransfer.files ?? [])
    if (dropped.length > 0) {
      void uploadFiles(dropped)
    }
  }

  const etaText =
    allCompleted && batchStartAt && batchCompletedAt
      ? (() => {
          const totalSeconds = Math.max(1, Math.round((batchCompletedAt - batchStartAt) / 1000))
          if (totalSeconds < 60) return `${totalSeconds}s`
          return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`
        })()
      : etaSeconds === null
        ? '-'
        : etaSeconds < 60
          ? `${etaSeconds}s left`
          : `${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s left`

  const summarySpeedText = (() => {
    if (allCompleted && batchStartAt && batchCompletedAt && totalBytes > 0) {
      const totalSeconds = Math.max((batchCompletedAt - batchStartAt) / 1000, 1)
      const avgSpeed = totalBytes / totalSeconds
      return `${formatStableBytes(avgSpeed)}/s`
    }
    if (speedBytesPerSec > 0) {
      return `${formatStableBytes(speedBytesPerSec)}/s`
    }
    return '-'
  })()

  return (
    <div className="flex flex-col gap-5 text-sm">
      <UploadTargetDropdown
        storagePools={storagePools}
        value={target}
        onChange={setTarget}
        onBeforeOpen={ensureStoragePoolsLoaded}
        onError={setTargetError}
      />
      {targetError ? <div className="mt-2 text-xs text-red-400">{targetError}</div> : null}

      <div
        onDragEnter={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragActive(false)
        }}
        onDrop={handleDrop}
        className={`border-app-border bg-app-bg/40 flex w-full flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${
          dragActive ? 'border-app-border-strong bg-app-hover/35' : ''
        }`}
      >
        <div className="bg-app-hover text-app-text mb-3 flex h-10 w-10 items-center justify-center rounded-full">
          <Upload className="h-5 w-5" />
        </div>
        <h3 className="text-app-text text-sm font-semibold">Drag files/folders here</h3>
        <p className="text-app-text-muted mt-1 text-xs">Choose from your device.</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            icon={FileUp}
            size="sm"
            onClick={async () => {
              await ensureStoragePoolsLoaded()
              fileInputRef.current?.click()
            }}
          >
            Upload Files
          </Button>
          <Button
            variant="secondary"
            icon={FolderUp}
            size="sm"
            onClick={async () => {
              await ensureStoragePoolsLoaded()
              folderInputRef.current?.click()
            }}
          >
            Upload Folder
          </Button>
        </div>

        <input ref={fileInputRef} type="file" multiple onChange={handleFilePick} className="hidden" />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          onChange={handleFilePick}
          className="hidden"
          {...({ webkitdirectory: 'true', directory: 'true' } as Record<string, string>)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-app-text text-sm font-semibold">Upload Queue</span>
          {recentFiles.length > 0 ? (
            <button type="button" onClick={clearCompleted} className="text-app-text-muted hover:text-app-text text-xs">
              Clear Completed
            </button>
          ) : null}
        </div>

        {recentFiles.length > 0 ? (
          <div className="bg-app-hover/35 mb-3 rounded-xl px-3 py-2.5">
            <div className="text-app-text mb-1 flex items-center justify-between text-sm tabular-nums">
              <span className="inline-block min-w-52 whitespace-nowrap">
                {formatStableBytes(uploadedBytes)} of {formatStableBytes(totalBytes)}
              </span>
              <span>
                {totalPercent >= 100 ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : `${totalPercent}%`}
              </span>
            </div>
            {totalPercent < 100 && (
              <div className="bg-app-bg/60 h-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-sky-500 transition-[width] duration-300"
                  style={{ width: `${totalPercent}%` }}
                />
              </div>
            )}
            <div className="text-app-text-muted mt-1.5 flex items-center justify-between text-sm tabular-nums">
              <span className="inline-block min-w-40 whitespace-nowrap">Speed: {summarySpeedText}</span>
              <span className="inline-block min-w-24 text-right whitespace-nowrap">
                {allCompleted ? 'Total' : 'ETA'}: {etaText}
              </span>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          {recentFiles.length === 0 ? (
            <EmptyState />
          ) : (
            recentFiles.map((file) => (
              <div key={file.id} className="bg-app-hover/30 rounded-xl px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {(() => {
                      const { Icon, color } = getUploadIconMeta(file.name)
                      return (
                        <div className="bg-app-bg/75 flex h-12 w-12 shrink-0 items-center justify-center rounded-md">
                          <Icon className={`h-6 w-6 ${color}`} />
                        </div>
                      )
                    })()}
                    <div className="min-w-0 flex-1">
                      <div className="text-app-text truncate text-xs font-medium">{file.name}</div>
                      <div className="text-app-text-muted mt-0.5 min-w-52 text-sm tabular-nums">
                        {formatStableBytes(
                          file.status === 'complete' ? file.size : Math.min(file.bytesUploaded || 0, file.size || 0),
                        )}{' '}
                        of {formatStableBytes(file.size)}{' '}
                        {file.status === 'uploading'
                          ? `· ${file.progress}%`
                          : file.status === 'queued'
                            ? '· queued'
                            : ''}
                      </div>
                      {file.status !== 'complete' && (
                        <div className="bg-app-bg/60 mt-1 h-1 w-full overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full bg-sky-500 transition-[width] duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="text-app-text-muted hover:text-app-text hover:bg-app-hover/60 rounded-full p-1 transition-colors"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="text-app-text-muted text-center text-[11px] font-medium">
                      {file.status === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-red-400" />
                      ) : file.status === 'complete' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : file.status === 'queued' ? (
                        'Queued'
                      ) : (
                        `${file.progress}%`
                      )}
                    </span>
                  </div>
                </div>
                {file.status === 'error' || file.stalled ? (
                  <div
                    className={`mt-1.5 flex min-w-0 items-start gap-1 pr-12 pl-[4.75rem] text-[11px] leading-4 ${
                      file.status === 'error' ? 'text-red-400' : 'text-amber-400'
                    }`}
                    title={file.errorMessage || (file.status === 'error' ? 'Upload failed' : 'Upload stalled')}
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 break-words">
                      {file.errorMessage ||
                        (file.status === 'error' ? 'Upload failed' : 'Upload stalled, waiting for response or retry.')}
                    </span>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
