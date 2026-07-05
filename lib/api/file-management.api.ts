import { request } from '@/lib/api/request'
import type { FileExplorerData, FileNode } from '@nextdj/file-explorer'

export type FileConflictPolicy = 'error' | 'overwrite' | 'rename'

export interface FileConflictResult {
  hasConflict: boolean
  name: string
  parentId: string
  targetId?: string
  targetType?: FileNode['type']
}

interface FileConflictPayload {
  parentId: string
  name?: string
}

interface FileTransferPayload extends FileConflictPayload {
  conflictPolicy?: FileConflictPolicy
}

export const fileManagementApi = {
  list: (storageId: string, params?: { parentId?: string }) => {
    const query = new URLSearchParams()
    if (params?.parentId) query.set('parentId', params.parentId)
    const suffix = query.toString()

    return request<FileExplorerData>(`/storages/${storageId}/files${suffix ? `?${suffix}` : ''}`)
  },

  createFolder: (storageId: string, payload: { parentId?: string; name: string }) =>
    request<FileNode>(`/storages/${storageId}/folders`, {
      method: 'POST',
      body: payload,
    }),

  rename: (storageId: string, fileId: string, name: string) =>
    request<FileNode>(`/storages/${storageId}/files/${fileId}`, {
      method: 'PATCH',
      body: { name },
    }),

  checkConflict: (storageId: string, fileId: string, payload: FileConflictPayload) =>
    request<FileConflictResult>(`/storages/${storageId}/files/${fileId}/conflicts`, {
      method: 'POST',
      body: payload,
    }),

  move: (storageId: string, fileId: string, payload: FileTransferPayload) =>
    request<FileNode>(`/storages/${storageId}/files/${fileId}/move`, {
      method: 'POST',
      body: payload,
    }),

  copy: (storageId: string, fileId: string, payload: FileTransferPayload) =>
    request<FileNode>(`/storages/${storageId}/files/${fileId}/copy`, {
      method: 'POST',
      body: payload,
    }),

  delete: (storageId: string, fileId: string) =>
    request<void>(`/storages/${storageId}/files/${fileId}`, {
      method: 'DELETE',
    }),
}
