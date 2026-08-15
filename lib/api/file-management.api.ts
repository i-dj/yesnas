import { request } from '@/lib/api/request'
import type { FileExplorerData, FileNode } from '@nextdj/file-explorer'
import type {
  FileConflictPayload,
  FileConflictResult,
  FileResponseData,
  FileTransferPayload,
  GetFilesOptions,
} from '@/types'
import { BASE } from './base'

const toFileQuery = (options: GetFilesOptions = {}) => {
  const query = new URLSearchParams()
  if (options.parentId) query.set('parentId', options.parentId)
  if (options.type) query.set('type', options.type)
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

const storagePath = (storageId: string) => `/storages/${encodeURIComponent(storageId)}`
const filePath = (storageId: string, fileId: string) => `${storagePath(storageId)}/files/${encodeURIComponent(fileId)}`

export const fileManagementApi = {
  contentUrl: (storageId: string, fileId: string, download = false) =>
    `${BASE}${filePath(storageId, fileId)}/content${download ? '?download=true' : ''}`,

  playableContentUrl: (storageId: string, fileId: string) => `${BASE}${filePath(storageId, fileId)}/playable-content`,

  hlsManifestUrl: (storageId: string, fileId: string) => `${BASE}${filePath(storageId, fileId)}/hls/index.m3u8`,

  hlsSegmentUrl: (storageId: string, fileId: string, segment: string) =>
    `${BASE}${filePath(storageId, fileId)}/hls/${encodeURIComponent(segment)}`,

  hlsStopUrl: (storageId: string, fileId: string) => `${BASE}${filePath(storageId, fileId)}/hls/stop`,

  thumbnailUrl: (storageId: string, fileId: string) => `${BASE}${filePath(storageId, fileId)}/thumbnail`,

  storageIoStatsStreamUrl: (storageId: string, intervalSeconds = 1) =>
    `${BASE}/storages/${storageId}/io-stats/stream?intervalSeconds=${intervalSeconds}`,

  storagesIoStatsStreamUrl: (intervalSeconds = 1) =>
    `${BASE}/storages/io-stats/stream?intervalSeconds=${intervalSeconds}`,

  list: (storageId: string, params?: { parentId?: string }) => {
    const query = new URLSearchParams()
    if (params?.parentId) query.set('parentId', params.parentId)
    const suffix = query.toString()

    return request<FileExplorerData>(`${storagePath(storageId)}/files${suffix ? `?${suffix}` : ''}`)
  },

  createFolder: (storageId: string, payload: { parentId?: string; name: string }) =>
    request<FileNode>(`${storagePath(storageId)}/folders`, {
      method: 'POST',
      body: payload,
    }),

  rename: (storageId: string, fileId: string, name: string) =>
    request<FileNode>(filePath(storageId, fileId), {
      method: 'PATCH',
      body: { name },
    }),

  checkConflict: (storageId: string, fileId: string, payload: FileConflictPayload) =>
    request<FileConflictResult>(`${filePath(storageId, fileId)}/conflicts`, {
      method: 'POST',
      body: payload,
    }),

  move: (storageId: string, fileId: string, payload: FileTransferPayload) =>
    request<FileNode>(`${filePath(storageId, fileId)}/move`, {
      method: 'POST',
      body: payload,
    }),

  copy: (storageId: string, fileId: string, payload: FileTransferPayload) =>
    request<FileNode>(`${filePath(storageId, fileId)}/copy`, {
      method: 'POST',
      body: payload,
    }),

  delete: (storageId: string, fileId: string) =>
    request<void>(filePath(storageId, fileId), {
      method: 'DELETE',
    }),

  filesByPath: (storageId: string, options: GetFilesOptions = {}) =>
    request<FileResponseData>(`${storagePath(storageId)}/files${toFileQuery(options)}`),
}
