import { getRequestTimeZone } from '@/lib/server/request-context'
import { UsersClient } from './UsersClient'
import { groupApi, userApi } from '@/lib/api/user.api'

export default async function UsersPage() {
  const now = new Date().toISOString()
  const [users, groups, timeZone] = await Promise.all([userApi.list(), groupApi.list(), getRequestTimeZone()])

  return <UsersClient users={users} groups={groups} timeZone={timeZone} now={now} />
}
