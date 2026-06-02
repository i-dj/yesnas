import type { LucideIcon } from 'lucide-react'

export type ProtocolKey = 'smb' | 'ftp' | 'webdav' | 'nfs'
export type ShareStatus = 'enabled' | 'disabled'

export interface ProtocolItem {
  protocol: ProtocolKey
  key: ProtocolKey
  icon: LucideIcon
  shareUrl: string
  port: number
  active: boolean
  serviceName?: string
  status: string
  shareCount: number
}

export interface SharedFolder {
  id: string
  name: string
  storagePoolId: string
  path: string
  protocols: ProtocolKey[]
  userIds: string[]
  users?: Array<{
    id: string
    username: string
    displayName: string
    avatar: string
    status: string
  }>
  clientNetworks: string[]
  status: ShareStatus
  enabled?: boolean
  createdAt?: string
  updatedAt: string
}

export interface FileShareProtocolItem {
  protocol: ProtocolKey
  serviceName: string
  active: boolean
  status: string
  shareUrl: string
  port: number
  shareCount: number
}
