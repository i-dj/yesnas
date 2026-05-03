import {
  getFileContentUrl,
  getFileThumbnailUrl,
  getStorageFilesUrl,
  getStoragesUrl,
  getTaggedFilesUrl,
  getTrashFilesUrl,
} from '@/lib/file-api'
import { StorageDrive } from '@/types' // Assumes StorageDrive is exported from the shared types module
import { BreadcrumbItem, FileNode } from '@nextdj/file-explorer'
/**
 * Fetches the full storage node list.
 * Backend endpoint: GET /api/v1/storages
 */
export async function getAllStorages(): Promise<StorageDrive[]> {
  const url = getStoragesUrl()
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Fetch storages failed: ${res.status}`)
  return res.json()
}

export async function getStorageById(
  storageId: string,
): Promise<StorageDrive | null> {
  const storages = await getAllStorages()

  return storages.find((storage) => storage.id === storageId) ?? null
}

export async function getAllTaggedFiles(): Promise<FileNode[]> {
  const url = getTaggedFilesUrl()

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`API error: ${res.status}`)

  return res.json()
}

interface TrashFileResponse {
  id: string
  storageId: string
  name: string
  type: FileNode['type']
  parentId?: string
  originalPath?: string
  recyclePath?: string
  deletedAt: string
  expiresAt?: string
  size?: number
  extension?: string
  isHidden?: boolean
  mimeType?: string
  mediaType?: string
  tagColors?: FileNode['tagColors']
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

export async function getAllTrashFiles(): Promise<FileNode[]> {
  const url = getTrashFilesUrl()

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`API error: ${res.status}`)

  const data: TrashFileResponse[] = await res.json()

  return data.map(mapTrashFileToNode)
}

/**
 * Returns the full file content or download URL.
 */
export function getContentUrl(
  storageId: string,
  fileId: string,
  download = false,
) {
  return getFileContentUrl(storageId, fileId, download)
}

/**
 * Returns the full thumbnail URL.
 */
export function getThumbnailUrl(storageId: string, fileId: string) {
  return getFileThumbnailUrl(storageId, fileId)
}

export interface FileResponseData {
  breadcrumbs: BreadcrumbItem[]
  files: FileNode[]
}

type FileQueryType = 'recent' | 'trash' | 'tag'

interface GetFilesOptions {
  parentId?: string
  type?: FileQueryType
}

/**
 * Fetches the file list under a specific storage node.
 * Backend endpoint: GET /api/v1/storages/{storageId}/files
 */
export async function getFilesByPath(
  storageId: string, // Pass the storage ID, such as '1', '2', or 'local'
  options: GetFilesOptions = {},
): Promise<FileResponseData> {
  const { parentId, type } = options

  const params = new URLSearchParams()
  if (parentId) params.set('parentId', parentId)
  if (type) params.set('type', type)

  const url = getStorageFilesUrl(storageId, params)

  console.log('Fetching files from:', url)
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`API error: ${res.status}`)

  return res.json()
}
