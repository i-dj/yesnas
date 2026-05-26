export interface SmbShare {
  id: string
  name: string
  storagePoolId: string
  path: string
  enabled: boolean
  browseable: boolean
  readOnly: boolean
  userIds: string[]
  createdAt?: string
  updatedAt?: string
}

export interface SmbSharePayload {
  name: string
  storagePoolId: string
  path: string
  enabled: boolean
  browseable: boolean
  readOnly: boolean
  userIds: string[]
}
