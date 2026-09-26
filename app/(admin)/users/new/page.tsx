import { groupApi } from '@/lib/api/user.api'

import { UserFormPageClient } from '../components/user-form-page-client'

export default async function NewUserPage() {
  const groups = await groupApi.list()

  return <UserFormPageClient editingUser={null} groups={groups} />
}
