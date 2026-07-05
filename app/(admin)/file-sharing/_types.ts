import type { LucideIcon } from 'lucide-react'

export type ProtocolKey = 'smb' | 'ftp' | 'webdav' | 'nfs'
export type ShareStatus = 'enabled' | 'disabled'

export interface ProtocolItem {
  key: ProtocolKey
  icon: LucideIcon
  shareUrl: string
  active: boolean
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
  active: boolean
  shareUrl: string
}
