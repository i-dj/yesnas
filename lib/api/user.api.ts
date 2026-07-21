import { createCrudApi } from './crud'
import { Group, User } from '@/types'

export const userApi = {
  ...createCrudApi<User>('/users'),
}

export const groupApi = {
  ...createCrudApi<Group>('/groups'),
}
