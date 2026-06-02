import { useState } from 'react'
import type { User } from '@/types'

export type UserModalState = {
  user: User | null
  mode: 'create' | 'edit' | 'delete' | null
  drawerOpen: boolean
}

export function useUserModal() {
  const [state, setState] = useState<UserModalState>({
    user: null,
    mode: null,
    drawerOpen: false,
  })

  const openCreate = () => {
    setState({
      user: null,
      mode: 'create',
      drawerOpen: true,
    })
  }

  const openEdit = (user: User) => {
    setState({
      user,
      mode: 'edit',
      drawerOpen: true,
    })
  }

  const openDelete = (user: User) => {
    setState({
      user,
      mode: 'delete',
      drawerOpen: false,
    })
  }

  const close = () => {
    setState({
      user: null,
      mode: null,
      drawerOpen: false,
    })
  }

  const isEdit = state.mode === 'edit'
  const isCreate = state.mode === 'create'
  const isDelete = state.mode === 'delete'

  return {
    state,
    openCreate,
    openEdit,
    openDelete,
    close,
    isEdit,
    isCreate,
    isDelete,
  }
}
