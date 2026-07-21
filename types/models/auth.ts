export interface AuthUser {
  id: string
  username: string
  displayName: string
  avatar: string
  groups?: Array<{
    id: string
    name: string
  }>
  groupIds?: string[]
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  tokenType: string
  expiresAt: string
  user: AuthUser
}

export interface UpdateProfilePayload {
  displayName: string
  avatar: string
}

export interface UpdatePasswordPayload {
  currentPassword: string
  newPassword: string
}
