const FILE_API_HOST = 'http://yesnas:8080/api/v1'

export const getFileApiHost = () => FILE_API_HOST

export const getStoragesUrl = () => `${FILE_API_HOST}/storages`
export const getRaidCandidatesUrl = () => `${FILE_API_HOST}/system/raid/candidates`
export const getSystemDisksUrl = () => `${FILE_API_HOST}/system/disks`
export const getSystemStatusUrl = () => `${FILE_API_HOST}/system/status`
export const getSystemStatusStreamUrl = (interval = 2) => `${FILE_API_HOST}/system/status/stream?interval=${interval}`
export const getSystemHardwareStreamUrl = (interval = 3) =>
  `${FILE_API_HOST}/system/hardware/stream?interval=${interval}`
export const getSystemNetworkUrl = (range = '1h') => `${FILE_API_HOST}/system/network?range=${range}`
export const getSystemNetworkStreamUrl = (interval = 1) => `${FILE_API_HOST}/system/network/stream?interval=${interval}`
export const getDockerContainersStreamUrl = (interval = 1) =>
  `${FILE_API_HOST}/docker/containers/stream?interval=${interval}`
export const getStoragePoolsUrl = () => `${FILE_API_HOST}/system/storage-pools`
export const getJobsUrl = () => `${FILE_API_HOST}/jobs`
export const getUsersUrl = () => `${FILE_API_HOST}/users`
export const getFileSharesUrl = () => `${FILE_API_HOST}/file-shares`
export const getFileShareUrl = (shareId: string) => `${FILE_API_HOST}/file-shares/${shareId}`
export const getFileShareProtocolsUrl = () => `${FILE_API_HOST}/file-shares/protocols`
export const getFileShareProtocolActionUrl = (protocol: string) =>
  `${FILE_API_HOST}/file-shares/protocols/${protocol}/action`
export const getStoragePoolBenchmarkStreamUrl = (poolId: string, sizeGiB?: number) => {
  const query = new URLSearchParams()
  if (sizeGiB) query.set('sizeGiB', String(sizeGiB))
  const suffix = query.toString()
  const base = `${FILE_API_HOST}/system/storage-pools/${poolId}/benchmark/stream`
  return suffix ? `${base}?${suffix}` : base
}

export const getTaggedFilesUrl = () => `${FILE_API_HOST}/files/tags`

export const getTrashFilesUrl = () => `${FILE_API_HOST}/files/trash`

export const getStorageFilesUrl = (storageId: string, params?: URLSearchParams) => {
  const query = params?.toString()
  const base = `${FILE_API_HOST}/storages/${storageId}/files`

  return query ? `${base}?${query}` : base
}

export const getFileContentUrl = (storageId: string, fileId: string, download = false) => {
  const base = `${FILE_API_HOST}/storages/${storageId}/files/${fileId}/content`

  return download ? `${base}?download=true` : base
}

export const getFileThumbnailUrl = (storageId: string, fileId: string) =>
  `${FILE_API_HOST}/storages/${storageId}/files/${fileId}/thumbnail`

export const getStorageIoStatsStreamUrl = (storageId: string, intervalSeconds = 1) => {
  const params = new URLSearchParams({
    intervalSeconds: String(intervalSeconds),
  })

  return `${FILE_API_HOST}/storages/${storageId}/io-stats/stream?${params.toString()}`
}

export const getStoragesIoStatsStreamUrl = (intervalSeconds = 1) => {
  const params = new URLSearchParams({
    intervalSeconds: String(intervalSeconds),
  })

  return `${FILE_API_HOST}/storages/io-stats/stream?${params.toString()}`
}
export function unwrapList<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json
  if (!json || typeof json !== 'object') return []
  const record = json as Record<string, unknown>
  if (Array.isArray(record.items)) return record.items as T[]
  if (Array.isArray(record.data)) return record.data as T[]
  if (Array.isArray(record.users)) return record.users as T[]
  return []
}

export async function readItems<T>(res: Response): Promise<T[]> {
  const json = await res.json()
  return unwrapList<T>(json)
}
