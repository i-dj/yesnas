import type { EnableStatus } from './_constants'

export interface User {
  id: string
  username: string
  displayName: string
  isAdmin: boolean
  avatar: string
  status: EnableStatus
  smbUsername: string
  groups?: Group[]
  groupIds?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface Group {
  id: string
  name: string
  description: string
  userCount: number
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
  groupIds?: string[]
}

export interface UpdateUserPayload {
  displayName: string
  isAdmin?: boolean
  avatar?: string
  status: EnableStatus
  password?: string
  groupIds?: string[]
}
