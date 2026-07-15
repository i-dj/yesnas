import { getServerTimeZone } from '@/lib/server/file-service'
import { UsersClient } from './UsersClient'
import { userApi } from '@/lib/api/user.api'

export default async function UsersPage() {
  const now = new Date().toISOString()
  const [users, timeZone] = await Promise.all([userApi.list(), getServerTimeZone()])

  return <UsersClient users={users} timeZone={timeZone} now={now} />
}
