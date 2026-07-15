export type CloudStorageProvider = 'google-drive' | 'onedrive' | 'dropbox'

export interface CloudStorageConnectPayload {
  name: string
  rootPath: string
}

export interface CloudStorageConnectResponse {
  provider: string
  authUrl: string
  state: string
  redirectUrl: string
  expiresAt: string
}

export interface CloudStorageOAuthStatusResponse {
  status: 'pending' | 'success' | 'error' | 'expired' | string
  message?: string
}

export interface CloudStorageCompleteResponse {
  connected: boolean
  provider: string
  storageId: string
  storage?: Record<string, unknown>
  rcloneRemoteName?: string
}
