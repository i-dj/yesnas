import {
  getAllStorages,
  getAllTaggedFiles,
  getAllTrashFiles,
} from '@/lib/server/file-service'
import { FileClient } from './FileClient'

export default async function Page() {
  const [storages, taggedFiles, trashFiles] = await Promise.all([
    getAllStorages(),
    getAllTaggedFiles(),
    getAllTrashFiles(),
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
