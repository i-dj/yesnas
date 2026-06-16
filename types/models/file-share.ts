import type { EnableStatus } from './_constants'
import type { User } from './user'

export type ProtocolKey = 'smb' | 'ftp' | 'webdav' | 'nfs'

export interface SharedFolder {
  id: string
  name: string
  storagePoolId: string
  path: string
  protocols: ProtocolKey[]
  userIds: string[]
  users?: User[]
  clientNetworks: string[]
  status: EnableStatus
  enabled?: boolean
  createdAt?: string
  updatedAt: string
}

export interface ProtocolItem {
  protocol: ProtocolKey
  serviceName: string
  active: boolean
  status: string
  shareUrl: string
  port: number
  shareCount: number
}
