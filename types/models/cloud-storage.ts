export type CloudStorageProvider = 'google-drive' | 'onedrive' | 'dropbox'
export type NetworkStorageProtocol = 'ftp' | 'webdav' | 'smb' | 'nfs'

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

export interface NetworkStorageCreatePayload {
  name: string
  protocol: NetworkStorageProtocol
  host?: string
  port?: number
  url?: string
  username?: string
  password?: string
  domain?: string
  shareName?: string
  rootPath?: string
}

export interface NetworkStorageCreateResponse {
  connected: boolean
  storageId: string
  storage?: Record<string, unknown>
}

export interface SMBShareListPayload {
  host: string
  username?: string
  password?: string
  domain?: string
}

export interface SMBShareItem {
  name: string
  comment?: string
}

export interface SMBShareListResponse {
  items: SMBShareItem[]
}
