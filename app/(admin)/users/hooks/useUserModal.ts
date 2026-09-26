import { useCallback, useState } from 'react'
import type { User } from '@/types'

export type UserModalState = {
  user: User | null
  mode: 'delete' | null
}

export function useUserModal() {
  const [state, setState] = useState<UserModalState>({
    user: null,
    mode: null,
  })

  const openDelete = useCallback((user: User) => {
    setState({
      user,
      mode: 'delete',
    })
  }, [])

  const close = useCallback(() => {
    setState({
      user: null,
      mode: null,
    })
  }, [])

  return {
    state,
    openDelete,
    close,
    isDelete: state.mode === 'delete',
  }
}
