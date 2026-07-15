import { request } from './request'
import type { AuthUser, LoginPayload, LoginResponse, UpdatePasswordPayload, UpdateProfilePayload } from '@/types'

export const authApi = {
  login: (payload: LoginPayload) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      silentNetworkLoading: true,
    }),

  logout: () =>
    request<{ success?: boolean } | null>('/auth/logout', {
      method: 'POST',
      silentNetworkLoading: true,
    }),

  updateProfile: (payload: UpdateProfilePayload) =>
    request<AuthUser>('/users/me/profile', {
      method: 'PUT',
      body: payload,
    }),

  updatePassword: (payload: UpdatePasswordPayload) =>
    request<{ updated: boolean }>('/users/me/password', {
      method: 'PUT',
      body: payload,
    }),
}
