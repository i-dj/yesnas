import { request } from '@/lib/api/request'
import type { FileExplorerData, FileNode } from '@nextdj/file-explorer'
import type {
  FileConflictPayload,
  FileConflictResult,
  FileResponseData,
  FileTransferPayload,
  GetFilesOptions,
  TrashFileResponse,
} from '@/types'
import { BASE } from './base'

const toFileQuery = (options: GetFilesOptions = {}) => {
  const query = new URLSearchParams()
  if (options.parentId) query.set('parentId', options.parentId)
  if (options.type) query.set('type', options.type)
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

const mapTrashFileToNode = (file: TrashFileResponse): FileNode => ({
  id: file.id,
  name: file.name,
  type: file.type,
  parentId: file.parentId,
  size: file.size,
  extension: file.extension?.replace(/^\./, ''),
  updatedAt: file.deletedAt,
  isHidden: file.isHidden,
  mimeType: file.mimeType,
  mediaType: file.mediaType,
  tagColors: file.tagColors ?? [],
  metadata: {
    storageId: file.storageId,
    originalPath: file.originalPath,
    recyclePath: file.recyclePath,
    deletedAt: file.deletedAt,
    expiresAt: file.expiresAt,
  },
})

export const fileManagementApi = {
  contentUrl: (storageId: string, fileId: string, download = false) =>
    `${BASE}/storages/${storageId}/files/${fileId}/content${download ? '?download=true' : ''}`,

  thumbnailUrl: (storageId: string, fileId: string) =>
    `${BASE}/storages/${storageId}/files/${fileId}/thumbnail`,

  storageIoStatsStreamUrl: (storageId: string, intervalSeconds = 1) =>
    `${BASE}/storages/${storageId}/io-stats/stream?intervalSeconds=${intervalSeconds}`,

  storagesIoStatsStreamUrl: (intervalSeconds = 1) =>
    `${BASE}/storages/io-stats/stream?intervalSeconds=${intervalSeconds}`,

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

  filesByPath: (storageId: string, options: GetFilesOptions = {}) =>
    request<FileResponseData>(`/storages/${storageId}/files${toFileQuery(options)}`),

  taggedFiles: () => request<FileNode[]>('/files/tags'),

  trashFiles: async () => {
    const files = await request<TrashFileResponse[]>('/files/trash')
    return files.map(mapTrashFileToNode)
  },
}
