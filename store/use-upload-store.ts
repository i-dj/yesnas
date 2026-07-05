import { create } from 'zustand'
import { uppy } from '@/lib/uppy'
import { toast } from './use-toast-store'

interface UploadFile {
  id: string
  name: string
  type?: string
  size: number
  bytesUploaded: number
  addedAt: string
  previewUrl?: string
  progress: number
  stalled?: boolean
  errorMessage?: string
  status: 'queued' | 'uploading' | 'complete' | 'error'
}

interface UploadState {
  files: Record<string, UploadFile>
  isUploading: boolean
  removeFile: (id: string) => void
  clearCompleted: () => void
}

const parseUploadErrorMessage = (raw: string, fallback: string) => {
  if (!raw) return fallback
  const tusResponseText = raw.match(/response text:\s*([\s\S]*?),\s*request id:/)
  if (tusResponseText?.[1]?.trim()) {
    return tusResponseText[1].trim()
  }
  try {
    const parsed = JSON.parse(raw) as { message?: string; error?: string }
    return parsed.message || parsed.error || raw
  } catch {
    return raw
  }
}

const getUploadErrorMessage = (error: Error) => {
  const detailedError = error as Error & {
    originalResponse?: { getBody?: () => string }
  }
  const responseBody = detailedError.originalResponse?.getBody?.()
  return parseUploadErrorMessage(responseBody || error.message, error.message)
}

const isTargetAlreadyExistsError = (message: string) =>
  message.toLowerCase().includes('target file already exists')

export const useUploadStore = create<UploadState>((set) => {
  uppy.on('file-added', (file) => {
    const fileData = file.data as File | Blob | undefined
    const fileType = file.type || (fileData instanceof File ? fileData.type : '')
    const isImage = fileType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.name || '')
    const previewUrl = fileData && isImage ? URL.createObjectURL(fileData as Blob) : undefined

    set((state) => ({
      isUploading: true,
      files: {
        ...state.files,
        [file.id]: {
          id: file.id,
          name: file.name,
          type: fileType,
          size: file.size ?? 0,
          bytesUploaded: 0,
          addedAt: new Date().toISOString(),
          previewUrl,
          progress: 0,
          stalled: false,
          status: 'queued',
        },
      },
    }))
  })

  uppy.on('upload-progress', (file, progress) => {
    if (!file) return
    const total = progress.bytesTotal ?? 0
    const uploaded = progress.bytesUploaded ?? 0
    const percentage = total > 0 ? Math.round((uploaded / total) * 100) : 0

    set((state) => ({
      files: {
        ...state.files,
        [file.id]: {
          ...state.files[file.id],
          bytesUploaded: uploaded,
          progress: percentage,
          stalled: false,
          status: 'uploading',
        },
      },
    }))
  })

  // 3. 上传成功
  uppy.on('upload-success', (file) => {
    if (!file) return
    set((state) => ({
      files: {
        ...state.files,
        [file.id]: {
          ...state.files[file.id],
          status: 'complete',
          stalled: false,
          errorMessage: undefined,
          bytesUploaded: file.size ?? state.files[file.id]?.size ?? 0,
          progress: 100,
        },
      },
    }))
  })

  uppy.on('upload-error', (file, error) => {
    if (!file) return
    const errorMessage = getUploadErrorMessage(error)
    let finalizedBeforeResponse = false

    set((state) => {
      const current = state.files[file.id]
      const size = file.size ?? current?.size ?? 0
      const progressBytes =
        typeof file.progress?.bytesUploaded === 'number' ? file.progress.bytesUploaded : 0
      const uploaded = Math.max(current?.bytesUploaded ?? 0, progressBytes)
      finalizedBeforeResponse =
        size > 0 && uploaded >= size && isTargetAlreadyExistsError(errorMessage)

      return {
        files: {
          ...state.files,
          [file.id]: {
            ...current,
            status: finalizedBeforeResponse ? 'complete' : 'error',
            stalled: false,
            errorMessage: finalizedBeforeResponse ? undefined : errorMessage,
            bytesUploaded: finalizedBeforeResponse ? size : uploaded,
            progress: finalizedBeforeResponse ? 100 : current?.progress ?? 0,
          },
        },
      }
    })

    if (finalizedBeforeResponse) {
      toast.success(`${file.name} uploaded successfully.`, 3300)
      console.warn('Upload finalize response was not successful, but the target file already exists:', file.name)
      return
    }

    toast.error(errorMessage, 5000)
    console.warn('Upload failed:', error)
  })

  uppy.on('upload-stalled', (error, files) => {
    const stalledIds = new Set(files.map((file) => file.id))
    set((state) => ({
      files: Object.fromEntries(
        Object.entries(state.files).map(([id, file]) => [
          id,
          stalledIds.has(id)
            ? {
                ...file,
                stalled: true,
                errorMessage: error.message,
              }
            : file,
        ]),
      ),
    }))
    console.warn('上传暂无进展:', error, files)
  })

  uppy.on('complete', (result) => {
    set({ isUploading: false })
    const successCount = result?.successful?.length ?? 0
    const failedCount = result?.failed?.length ?? 0

    if (successCount > 0) {
      if (failedCount > 0) {
        toast.warning(`Upload finished: ${successCount} file(s) uploaded, ${failedCount} failed.`, 3300)
      } else {
        toast.success(`Upload completed: ${successCount} file(s) uploaded successfully.`, 3300)
      }
    }

    if (failedCount > 0) {
      console.warn(`${failedCount} 个文件上传失败`)
    }
  })

  return {
    files: {},
    isUploading: false,
    removeFile: (id) =>
      set((state) => {
        try {
          if (uppy.getFile(id)) {
            uppy.removeFile(id)
          }
        } catch {
          // ignore uppy cleanup errors
        }
        const newFiles = { ...state.files }
        const current = newFiles[id]
        if (current?.previewUrl) {
          URL.revokeObjectURL(current.previewUrl)
        }
        delete newFiles[id]
        return {
          files: newFiles,
          isUploading: Object.values(newFiles).some((file) => file.status === 'uploading' || file.status === 'queued'),
        }
      }),

    clearCompleted: () =>
      set((state) => {
        const activeFiles: Record<string, UploadFile> = {}
        Object.values(state.files).forEach((f) => {
          if (f.status === 'uploading' || f.status === 'queued') {
            activeFiles[f.id] = f
          } else if (f.previewUrl) {
            URL.revokeObjectURL(f.previewUrl)
          }
          if (f.status !== 'uploading' && f.status !== 'queued') {
            try {
              if (uppy.getFile(f.id)) {
                uppy.removeFile(f.id)
              }
            } catch {
              // ignore uppy cleanup errors
            }
          }
        })
        return {
          files: activeFiles,
          isUploading: Object.keys(activeFiles).length > 0,
        }
      }),
  }
})
