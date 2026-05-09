const FILE_API_HOST = 'http://yesnas:8080/api/v1'

export const getFileApiHost = () => FILE_API_HOST

export const getStoragesUrl = () => `${FILE_API_HOST}/storages`
export const getRaidCandidatesUrl = () =>
  `${FILE_API_HOST}/system/raid/candidates`
export const getSystemDisksUrl = () => `${FILE_API_HOST}/system/disks`
export const getStoragePoolsUrl = () => `${FILE_API_HOST}/system/storage-pools`
export const getStoragePoolBenchmarkStreamUrl = (
  poolId: string,
  sizeGiB?: number,
) => {
  const query = new URLSearchParams()
  if (sizeGiB) query.set('sizeGiB', String(sizeGiB))
  const suffix = query.toString()
  const base = `${FILE_API_HOST}/system/storage-pools/${poolId}/benchmark/stream`
  return suffix ? `${base}?${suffix}` : base
}

export const getTaggedFilesUrl = () => `${FILE_API_HOST}/files/tags`

export const getTrashFilesUrl = () => `${FILE_API_HOST}/files/trash`

export const getStorageFilesUrl = (
  storageId: string,
  params?: URLSearchParams,
) => {
  const query = params?.toString()
  const base = `${FILE_API_HOST}/storages/${storageId}/files`

  return query ? `${base}?${query}` : base
}

export const getFileContentUrl = (
  storageId: string,
  fileId: string,
  download = false,
) => {
  const base = `${FILE_API_HOST}/storages/${storageId}/files/${fileId}/content`

  return download ? `${base}?download=true` : base
}

export const getFileThumbnailUrl = (storageId: string, fileId: string) =>
  `${FILE_API_HOST}/storages/${storageId}/files/${fileId}/thumbnail`

export const getStorageIoStatsStreamUrl = (
  storageId: string,
  intervalSeconds = 1,
) => {
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
