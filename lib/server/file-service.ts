import {
  getFileContentUrl,
  getFileThumbnailUrl,
  getJobsUrl,
  getRaidCandidatesUrl,
  getStoragePoolsUrl,
  getSystemDisksUrl,
  getStorageFilesUrl,
  getStoragesUrl,
  getTaggedFilesUrl,
  getTrashFilesUrl,
  getUsersUrl,
} from '@/lib/file-api'
import type { CreateUserPayload, Job, StorageDrive, UpdateUserPayload, User } from '@/types'
import {
  CreateStoragePoolPayload,
  CreateStoragePoolSnapshotPayload,
  DiskModel,
  ReplaceStoragePoolDevicePayload,
  RestoreStoragePoolSnapshotPayload,
  StoragePoolModel,
} from '@/types/models/storage'
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

const parseErrorMessage = (raw: string, fallback: string) => {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as {
      message?: string
      error?: string
      code?: string
    }
    return parsed.message || parsed.error || parsed.code || raw
  } catch {
    return raw
  }
}

export async function getDisks(): Promise<DiskModel[]> {
  const disksRes = await fetch(getSystemDisksUrl())
  if (!disksRes.ok) {
    throw new Error(`Fetch system disks failed: ${disksRes.status}`)
  }
  const payload = (await disksRes.json()) as { items: DiskModel[] }
  return payload.items
}

export async function getStoragePools(): Promise<StoragePoolModel[]> {
  const res = await fetch(getStoragePoolsUrl(), { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Fetch storage pools failed: ${res.status}`)
  }
  const payload = (await res.json()) as StoragePoolModel[]
  return payload
}

export async function getJobs(): Promise<Job[]> {
  const res = await fetch(getJobsUrl(), { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Fetch jobs failed: ${res.status}`)
  }
  const payload = (await res.json()) as { items: Job[] }
  return payload.items
}

export function getServerTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export async function deleteJob(jobId: string | number) {
  const res = await fetch(`${getJobsUrl()}/${jobId}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseErrorMessage(text, `Delete job failed: ${res.status}`))
  }

  return res
}

export async function pauseJob(jobId: string | number) {
  return runJobAction(jobId, 'pause')
}

export async function resumeJob(jobId: string | number) {
  return runJobAction(jobId, 'resume')
}

export async function cancelJob(jobId: string | number) {
  return runJobAction(jobId, 'cancel')
}

async function runJobAction(jobId: string | number, action: 'pause' | 'resume' | 'cancel') {
  const res = await fetch(`${getJobsUrl()}/${jobId}/${action}`, {
    method: 'POST',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseErrorMessage(text, `${action} job failed: ${res.status}`))
  }

  return res
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(getUsersUrl(), { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Fetch users failed: ${res.status}`)
  }
  const payload = (await res.json()) as { items: User[] }
  return payload.items
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const res = await fetch(getUsersUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseErrorMessage(text, `Create user failed: ${res.status}`))
  }

  return res.json()
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<User> {
  const res = await fetch(`${getUsersUrl()}/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseErrorMessage(text, `Update user failed: ${res.status}`))
  }

  return res.json()
}

export async function deleteUser(userId: string) {
  const res = await fetch(`${getUsersUrl()}/${userId}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseErrorMessage(text, `Delete user failed: ${res.status}`))
  }

  return res.json() as Promise<{ deleted: boolean; id: string }>
}

export async function createStoragePool(payload: CreateStoragePoolPayload) {
  const res = await fetch(getStoragePoolsUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseErrorMessage(text, `Create storage pool failed: ${res.status}`))
  }

  return res
}

export async function deleteStoragePool(poolId: string) {
  const res = await fetch(`${getStoragePoolsUrl()}/${poolId}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseErrorMessage(text, `Delete storage pool failed: ${res.status}`))
  }

  return res
}

export async function createStoragePoolSnapshot(poolId: string, payload: CreateStoragePoolSnapshotPayload) {
  const res = await fetch(`${getStoragePoolsUrl()}/${poolId}/snapshots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      sourcePath: payload.sourcePath ?? '',
      description: payload.description ?? '',
      readOnly: payload.readOnly ?? true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseErrorMessage(text, `Create snapshot failed: ${res.status}`))
  }

  return res
}

export interface RestoreStoragePoolSnapshotResponse {
  id: string
  restored: boolean
  name?: string
  targetPath?: string
  backupPath?: string
}

export async function restoreStoragePoolSnapshot(
  poolId: string,
  snapshotId: string,
  payload: RestoreStoragePoolSnapshotPayload,
): Promise<RestoreStoragePoolSnapshotResponse> {
  const res = await fetch(`${getStoragePoolsUrl()}/${poolId}/snapshots/${snapshotId}/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password: payload.password,
      createBackup: payload.createBackup ?? true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseErrorMessage(text, `Restore snapshot failed: ${res.status}`))
  }

  return res.json()
}

export interface FormatStoragePoolPayload {
  password: string
}

export interface FormatStoragePoolResponse {
  id: string
  formatted: boolean
  formattedAt?: string
  pool?: StoragePoolModel
}

export async function formatStoragePool(
  poolId: string,
  payload: FormatStoragePoolPayload,
): Promise<FormatStoragePoolResponse> {
  const res = await fetch(`${getStoragePoolsUrl()}/${poolId}/format`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseErrorMessage(text, `Format pool failed: ${res.status}`))
  }

  return res.json()
}

export async function replaceStoragePoolDevice(poolId: string, payload: ReplaceStoragePoolDevicePayload) {
  const res = await fetch(`${getStoragePoolsUrl()}/${poolId}/devices/replace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      password: payload.password,
      oldDevicePath: payload.oldDevicePath,
      newDevicePath: payload.newDevicePath,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseErrorMessage(text, `Replace pool device failed: ${res.status}`))
  }

  return res
}

export async function getStorageById(storageId: string): Promise<StorageDrive | null> {
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
export function getContentUrl(storageId: string, fileId: string, download = false) {
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
