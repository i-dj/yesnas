import { StorageClient } from './StorageClient'
import { storageApi } from '@/lib/api/storage.api'
import { diskApi } from '@/lib/api/disk.api'

import type { PoolSource } from './types'

export default async function Page({ searchParams }: { searchParams?: Promise<{ source?: string | string[] }> }) {
  const params = await searchParams

  const source = Array.isArray(params?.source) ? params.source[0] : params?.source
  const initialPoolSource: PoolSource =
    source === 'network' ? 'network' : source === 'removable' ? 'removable' : 'local'
  const [disks, storagePools] = await Promise.all([diskApi.list(), storageApi.list()])

  return <StorageClient diskList={disks} storagePools={storagePools} initialPoolSource={initialPoolSource} />
}
