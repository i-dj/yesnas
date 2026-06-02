import { getServerTimeZone, getUsers } from '@/lib/server/file-service'
import { UsersClient } from './UsersClient'
import { userApi } from '@/lib/api/user.api'

export default async function UsersPage() {
  const users = await userApi.list()

  const timeZone = getServerTimeZone()

  return <UsersClient users={users} timeZone={timeZone} />
}
