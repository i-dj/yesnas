import { create } from 'zustand'
import { uppy } from '@/lib/uppy'

interface UploadFile {
  id: string
  name: string
  progress: number
  status: 'uploading' | 'complete' | 'error'
}

interface UploadState {
  files: Record<string, UploadFile>
  isUploading: boolean
  removeFile: (id: string) => void
  clearCompleted: () => void
}

export const useUploadStore = create<UploadState>((set) => {
  uppy.on('file-added', (file) => {
    set((state) => ({
      isUploading: true,
      files: {
        ...state.files,
        [file.id]: {
          id: file.id,
          name: file.name,
          progress: 0,
          status: 'uploading',
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
          progress: percentage,
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
        },
      },
    }))
    console.error('上传失败:', error)
  })

  uppy.on('complete', (result) => {
    set({ isUploading: false })
    const failedCount = result?.failed?.length ?? 0
    if (failedCount > 0) {
      console.warn(`${failedCount} 个文件上传失败`)
    }
  })

  return {
    files: {},
    isUploading: false,

    removeFile: (id) =>
      set((state) => {
        const newFiles = { ...state.files }
        delete newFiles[id]
        return { files: newFiles }
      }),

    clearCompleted: () =>
      set((state) => {
        const activeFiles: Record<string, UploadFile> = {}
        Object.values(state.files).forEach((f) => {
          if (f.status === 'uploading') activeFiles[f.id] = f
        })
        return {
          files: activeFiles,
          isUploading: Object.keys(activeFiles).length > 0,
        }
      }),
  }
})
