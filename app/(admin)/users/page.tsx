import { getServerTimeZone, getUsers } from '@/lib/server/file-service'
import { UsersClient } from './UsersClient'

export default async function UsersPage() {
  const users = await getUsers().catch(() => [])
  const timeZone = getServerTimeZone()

  return <UsersClient users={users} timeZone={timeZone} />
}
