import { createCrudApi } from './crud'
import { User } from '@/types'

export const userApi = {
  ...createCrudApi<User>('/users'),
}
