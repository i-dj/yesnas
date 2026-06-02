import { EnableStatus } from '@/types'

export type UserFormState = {
  username: string
  displayName: string
  isAdmin: boolean
  avatar: string
  password: string
  status: EnableStatus
}

export const createEmptyUserForm = (): UserFormState => ({
  username: '',
  displayName: '',
  isAdmin: false,
  avatar: '',
  password: '',
  status: 'enabled',
})
