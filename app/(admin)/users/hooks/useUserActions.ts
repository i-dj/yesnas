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
      toast.error(`${t('messages.saveFailed')}: ${error instanceof Error ? error.message : String(error)}`, 20000)
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
