export type UserStatus = 'active' | 'disabled'
export type SmbStatus = 'enabled' | 'disabled' | 'error'

export interface User {
  id: string
  username: string
  displayName: string
  isAdmin: boolean
  avatar: string
  status: UserStatus
  smbUsername: string
  smbStatus: SmbStatus
  smbSyncedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserPayload {
  username: string
  displayName: string
  isAdmin?: boolean
  avatar?: string
  password: string
  status: UserStatus
}

export interface UpdateUserPayload {
  displayName: string
  isAdmin?: boolean
  avatar?: string
  status: UserStatus
  password?: string
}
