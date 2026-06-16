import { notFound } from 'next/navigation'

import { storageApi } from '@/lib/api/storage.api'
import { getDisks, getServerTimeZone } from '@/lib/server/file-service'
import { StoragePoolDetailPage } from '../../components/storage-pool-detail-page'

export default async function PoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [pools, disks] = await Promise.all([storageApi.list().catch(() => []), getDisks().catch(() => [])])
  const pool = pools.find((item) => item.id === id) ?? null

  if (!pool) notFound()

  return <StoragePoolDetailPage initialPool={pool} disks={disks} timeZone={getServerTimeZone()} />
}
