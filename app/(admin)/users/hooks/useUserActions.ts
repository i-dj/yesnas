import { useState } from 'react'
import { userApi } from '@/lib/api/user.api'
import { toast } from '@/store/use-toast-store'
import type { UserFormState } from '../types'
import type { UserModalState } from './useUserModal'

type Params = {
  modal: UserModalState
  onSuccess: () => void
  onClose: () => void
  t: any
  router: any
}

const LAST_ADMIN_DELETE_ERROR = 'Cannot delete the last administrator'
const USERNAME_UNIQUE_ERROR = 'UNIQUE constraint failed: users.username'

export function useUserActions({ modal, onSuccess, onClose, t, router }: Params) {
  const [loading, setLoading] = useState<'submit' | 'delete' | null>(null)

  const submit = async (form: UserFormState) => {
    setLoading('submit')

    try {
      if (modal?.mode === 'edit' && modal.user) {
        await userApi.update(modal.user.id, form)
        toast.success(t('messages.updated'))
      } else {
        await userApi.create(form)
        toast.success(t('messages.created'))
      }

      router.refresh()
      onSuccess()
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(
        message.includes(USERNAME_UNIQUE_ERROR)
          ? t('messages.usernameExists')
          : `${t('messages.saveFailed')}: ${message}`,
        20000,
      )
    } finally {
      setLoading(null)
    }
  }

  const remove = async () => {
    if (!modal?.user || modal.mode !== 'delete') return

    setLoading('delete')

    try {
      await userApi.remove(modal.user.id)

      toast.success(t('messages.deleted'))
      router.refresh()

      onSuccess()
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(
        message.includes(LAST_ADMIN_DELETE_ERROR)
          ? t('messages.lastAdminDeleteBlocked')
          : `${t('messages.deleteFailed')}: ${message}`,
        20000,
      )
    } finally {
      setLoading(null)
    }
  }

  return {
    loading,
    submit,
    remove,
  }
}
