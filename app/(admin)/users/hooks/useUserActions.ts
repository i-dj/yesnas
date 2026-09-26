import { useState } from 'react'
import { userApi } from '@/lib/api/user.api'
import { toast } from '@/store/use-toast-store'
import type { UserModalState } from './useUserModal'

type UserActionMessageKey = 'messages.deleted' | 'messages.lastAdminDeleteBlocked' | 'messages.deleteFailed'

type Params = {
  modal: UserModalState
  onSuccess: () => void
  onClose: () => void
  t: (key: UserActionMessageKey) => string
  router: { refresh: () => void }
}

const LAST_ADMIN_DELETE_ERROR = 'Cannot delete the last administrator'

export function useUserActions({ modal, onSuccess, onClose, t, router }: Params) {
  const [loading, setLoading] = useState<'delete' | null>(null)

  const remove = async () => {
    if (!modal.user || modal.mode !== 'delete') return

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
        50000,
      )
    } finally {
      setLoading(null)
    }
  }

  return {
    loading,
    remove,
  }
}
