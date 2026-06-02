import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Upload, FolderUp, FileUp, X, AlertCircle, CheckCircle2, FileIcon, Image as ImageIcon } from 'lucide-react'
import { Button, EmptyState, UploadTargetDropdown, type UploadTargetValue } from '@/components/ui'
import { uppy } from '@/lib/uppy'
import { useUploadStore } from '@/store/use-upload-store'
import { toast } from '@/store/use-toast-store'
import { bytesFormat } from '@/lib/utils'
import { getFileConfig } from '@/lib/file-utils'
import { getStoragePoolsUrl } from '@/lib/file-api'
import type { StoragePoolModel } from '@/types/models/storage'

const getUploadIconMeta = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const config = getFileConfig(name)
  if (!ext || config.Icon === FileIcon) {
    return { Icon: ImageIcon, color: 'text-sky-500' }
  }
  return config
}

export const GlobalUpload = () => {
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
  const filesMap = useUploadStore((state) => state.files)
  const removeFile = useUploadStore((state) => state.removeFile)
  const clearCompleted = useUploadStore((state) => state.clearCompleted)

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

    const now = Date.now()
    const prev = speedSnapshotRef.current
    const deltaBytes = uploadedBytes - prev.bytes
    const deltaSec = Math.max((now - prev.at) / 1000, 0.001)
    const instantSpeed = deltaBytes > 0 ? deltaBytes / deltaSec : 0
    const alpha = 0.22
    const blendedSpeed = prev.speed > 0 ? prev.speed * (1 - alpha) + instantSpeed * alpha : instantSpeed
    const speed = Math.max(blendedSpeed, 0)
    const remain = Math.max(totalBytes - uploadedBytes, 0)

    setSpeedBytesPerSec(speed)
    setEtaSeconds(speed > 0 ? Math.ceil(remain / speed) : null)
    speedSnapshotRef.current = { bytes: uploadedBytes, at: now, speed }
  }, [hasUploadingFiles, totalBytes, uploadedBytes])

  useEffect(() => {
    let cancelled = false
    const loadPools = async () => {
      try {
        const res = await fetch(getStoragePoolsUrl())
        if (!res.ok) throw new Error(`Load storage pools failed: ${res.status}`)
        const payload = (await res.json()) as StoragePoolModel[]
        if (cancelled) return
        setStoragePools(payload)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Failed to load storage pools'
        setTargetError(message)
        toast.error(`Load upload targets failed: ${message}`, 5000)
      }
    }
    loadPools()
    return () => {
      cancelled = true
    }
  }, [])

  const addFilesToUppy = (files: File[]) => {
    for (const file of files) {
      try {
        uppy.addFile({
          name: file.name,
          type: file.type || 'application/octet-stream',
          data: file,
          source: 'global-upload',
          meta: {
            relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || '',
            storagePoolId: target.storagePoolId,
            parentId: target.folderId,
          },
        })
      } catch (error) {
        console.warn('Add file to upload queue failed:', file.name, error)
      }
    }
  }

  const uploadFiles = (files: File[]) => {
    if (!target.storagePoolId) {
      toast.error('Upload failed: Please select upload target.')
      return
    }
    addFilesToUppy(files)
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
      return `${bytesFormat(avgSpeed, {
        standard: 'm',
        decimalPlaces: 2,
      })}/s`
    }
    if (speedBytesPerSec > 0) {
      return `${bytesFormat(speedBytesPerSec, {
        standard: 'm',
        decimalPlaces: 2,
      })}/s`
    }
    return '-'
  })()

  return (
    <div className="flex flex-col gap-5 text-sm">
      <UploadTargetDropdown storagePools={storagePools} value={target} onChange={setTarget} onError={setTargetError} />
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
          <Button variant="primary" icon={FileUp} size="sm" onClick={() => fileInputRef.current?.click()}>
            Upload Files
          </Button>
          <Button variant="secondary" icon={FolderUp} size="sm" onClick={() => folderInputRef.current?.click()}>
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
            <div className="text-app-text mb-1 flex items-center justify-between text-xs">
              <span>
                {bytesFormat(uploadedBytes, {
                  standard: 'm',
                  decimalPlaces: 2,
                })}{' '}
                of {bytesFormat(totalBytes, { standard: 'm', decimalPlaces: 2 })}
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
            <div className="text-app-text-muted mt-1.5 flex items-center justify-between text-[11px]">
              <span>Speed: {summarySpeedText}</span>
              <span>
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
                      <div className="text-app-text-muted mt-0.5 text-[11px]">
                        {bytesFormat(
                          file.status === 'complete' ? file.size : Math.min(file.bytesUploaded || 0, file.size || 0),
                          { standard: 'm', decimalPlaces: 2 },
                        )}{' '}
                        of{' '}
                        {bytesFormat(file.size, {
                          standard: 'm',
                          decimalPlaces: 2,
                        })}{' '}
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
