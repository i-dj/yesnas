import { getDisks, getStoragePools } from '@/lib/server/file-service'
import { StorageClient } from './StorageClient'

export default async function Page() {
  const [disks, storagePools] = await Promise.all([
    getDisks().catch(() => []),
    getStoragePools().catch(() => []),
  ])

  return <StorageClient diskList={disks} storagePools={storagePools} />
}
