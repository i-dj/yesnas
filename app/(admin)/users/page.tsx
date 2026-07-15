import { getRequestTimeZone } from '@/lib/server/request-context'
import { UsersClient } from './UsersClient'
import { userApi } from '@/lib/api/user.api'

export default async function UsersPage() {
  const now = new Date().toISOString()
  const [users, timeZone] = await Promise.all([userApi.list(), getRequestTimeZone()])

  return <UsersClient users={users} timeZone={timeZone} now={now} />
}
