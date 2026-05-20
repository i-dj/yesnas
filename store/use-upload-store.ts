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
    set((state) => ({
      files: {
        ...state.files,
        [file.id]: {
          ...state.files[file.id],
          status: 'error',
          stalled: false,
          errorMessage: getUploadErrorMessage(error),
        },
      },
    }))
    console.error('上传失败:', error)
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
      const title = failedCount > 0 ? 'Upload finished with warnings' : 'Upload completed'
      const description =
        failedCount > 0
          ? `${successCount} file(s) uploaded, ${failedCount} failed.`
          : `${successCount} file(s) uploaded successfully.`
      if (failedCount > 0) {
        toast.info(title, description, 3300)
      } else {
        toast.success(title, description, 3300)
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
