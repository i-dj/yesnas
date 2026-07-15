import { fileManagementApi } from '@/lib/api/file-management.api'
import { storageApi } from '@/lib/api/storage.api'
import { FileClient } from './FileClient'

export default async function Page() {
  const [storages, taggedFiles, trashFiles] = await Promise.all([
    storageApi.listStorages(),
    fileManagementApi.taggedFiles(),
    fileManagementApi.trashFiles(),
  ])
  return (
    <FileClient
      files={{
        trash: trashFiles ?? [],
        favorites: taggedFiles ?? [],
      }}
      storages={storages ?? []}
    />
  )
}
