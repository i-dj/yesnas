import { getServerTimeZone, getSmbShares, getStoragePools, getUsers } from '@/lib/server/file-service'
import { SmbClient } from './SmbClient'

export const dynamic = 'force-dynamic'

export default async function SmbPage() {
  const [shares, users, storagePools] = await Promise.all([
    getSmbShares().catch(() => []),
    getUsers().catch(() => []),
    getStoragePools().catch(() => []),
  ])
  const timeZone = getServerTimeZone()

  return <SmbClient shares={shares} users={users} storagePools={storagePools} timeZone={timeZone} />
}
