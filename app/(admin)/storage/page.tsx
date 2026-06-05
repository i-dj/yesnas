import { getDisks, getStoragePools } from '@/lib/server/file-service'
import { StorageClient } from './StorageClient'
import { storageApi } from '@/lib/api/storage.api'

export default async function Page() {
  const [disks, storagePools] = await Promise.all([getDisks().catch(() => []), storageApi.list()])

  return <StorageClient diskList={disks} storagePools={storagePools} />
}
