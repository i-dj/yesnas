import type { EnableStatus } from './_constants'

export interface User {
  id: string
  username: string
  displayName: string
  isAdmin: boolean
  avatar: string
  status: EnableStatus
  smbUsername: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserPayload {
  username: string
  displayName: string
  isAdmin?: boolean
  avatar?: string
  password: string
  status: EnableStatus
}

export interface UpdateUserPayload {
  displayName: string
  isAdmin?: boolean
  avatar?: string
  status: EnableStatus
  password?: string
}
