import type { UserStatus } from '@/types'

export type UserFormState = {
  username: string
  displayName: string
  isAdmin: boolean
  avatar: string
  password: string
  status: UserStatus
}

export const emptyUserForm: UserFormState = {
  username: '',
  displayName: '',
  isAdmin: false,
  avatar: '',
  password: '',
  status: 'active',
}
