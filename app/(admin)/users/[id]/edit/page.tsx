import { groupApi, userApi } from '@/lib/api/user.api'
import { notFound } from 'next/navigation'

import { UserFormPageClient } from '../../components/user-form-page-client'

interface EditUserPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params

  const [users, groups] = await Promise.all([userApi.list(), groupApi.list()])
  const user = users.find((item) => item.id === id)

  if (!user) {
    notFound()
  }

  return <UserFormPageClient editingUser={user} groups={groups} />
}
