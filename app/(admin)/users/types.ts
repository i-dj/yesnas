import { EnableStatus } from '@/types'

export type UserFormState = {
  username: string
  displayName: string
  isAdmin: boolean
  avatar: string
  password: string
  status: EnableStatus
  groupIds: string[]
}

export const createEmptyUserForm = (): UserFormState => ({
  username: '',
  displayName: '',
  isAdmin: false,
  avatar: '',
  password: '',
  status: 'enabled',
  groupIds: [],
})

export type GroupFormState = {
  name: string
  description: string
}

export const createEmptyGroupForm = (): GroupFormState => ({
  name: '',
  description: '',
})
