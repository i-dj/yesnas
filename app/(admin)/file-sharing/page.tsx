import { fileShareApi } from '@/lib/api/file-share.api'
import { userApi } from '@/lib/api/user.api'
import { FileSharingClient } from './file-sharing-client'
import { storageApi } from '@/lib/api/storage.api'

async function getInitialData() {
  const [storagePools, users, shares, protocols] = await Promise.all([
    storageApi.list(),
    userApi.list(),
    fileShareApi.list(),
    fileShareApi.protocols(),
  ])

  return {
    storagePools,
    users,
    shares,
    protocols,
  }
}
export default async function FileSharingPage() {
  const data = await getInitialData()
  return <FileSharingClient initialData={data} />
}
