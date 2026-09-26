'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import { PageBackHeader } from '@/components/ui'
import { userApi } from '@/lib/api/user.api'
import { toast } from '@/store/use-toast-store'
import type { Group, User } from '@/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import type { UserFormState } from '../types'
import { UserForm } from './user-form'

const USERNAME_UNIQUE_ERROR = 'UNIQUE constraint failed: users.username'

interface UserFormPageClientProps {
  editingUser: User | null
  groups: Group[]
}

export function UserFormPageClient({ editingUser, groups }: UserFormPageClientProps) {
  const t = useTranslations('Users')
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const backToUsers = () => {
    router.push('/users')
  }

  const handleSubmit = async (form: UserFormState) => {
    setSubmitting(true)

    try {
      if (editingUser) {
        await userApi.update(editingUser.id, form)
        toast.success(t('messages.updated'))
      } else {
        await userApi.create(form)
        toast.success(t('messages.created'))
      }

      router.push('/users')
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(
        message.includes(USERNAME_UNIQUE_ERROR)
          ? t('messages.usernameExists')
          : `${t('messages.saveFailed')}: ${message}`,
        20000,
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveSection = async (form: Partial<UserFormState>) => {
    if (!editingUser) return

    try {
      await userApi.update(editingUser.id, form)
      toast.success(t('messages.updated'))
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(`${t('messages.saveFailed')}: ${message}`, 20000)
      throw error
    }
  }

  return (
    <PageWrapper className="overflow-visible">
      <div className="mx-auto w-full max-w-[880px]">
        <PageBackHeader
          className="mb-8"
          title={editingUser ? t('form.editTitle') : t('form.createTitle')}
          description={t('subtitle')}
          onBack={backToUsers}
        />

        <UserForm
          editingUser={editingUser}
          groups={groups}
          submitting={submitting}
          contentClassName="px-0 pt-0 pb-8"
          onCancel={backToUsers}
          onSubmit={handleSubmit}
          onSaveSection={handleSaveSection}
        />
      </div>
    </PageWrapper>
  )
}
