// 节点类型 (如: 文件夹或文件)
export const FILE_NODES = {
  FOLDER: 'folder',
  FILE: 'file',
} as const
export type FileNodeType = (typeof FILE_NODES)[keyof typeof FILE_NODES]

// MIME 类型
export const MIMES = {
  TEXT_PLAIN: 'text/plain',
  TEXT_HTML: 'text/html',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  APPLICATION_JSON: 'application/json',
  APPLICATION_PDF: 'application/pdf',
} as const
export type Mime = (typeof MIMES)[keyof typeof MIMES] | (string & {})

//  驱动器/设备状态
export const DRIVE_STATUSES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  ERROR: 'error',
  SYNCING: 'syncing',
} as const
export type DriveStatus = (typeof DRIVE_STATUSES)[keyof typeof DRIVE_STATUSES]

export type EnableStatus = 'enabled' | 'disabled'



// 存储引擎类型
export const STORAGE_TYPES = {
  LOCAL: 'local',
  GOOGLE: 'google',
  ONEDRIVE: 'onedrive',
  DROPBOX: 'dropbox',
  WEBDAV: 'webdav',
  SMB: 'smb',
} as const
export type StorageType = (typeof STORAGE_TYPES)[keyof typeof STORAGE_TYPES]

export const RAID_LEVELS = {
  SINGLE: 'single',
  RAID0: 'raid0',
  RAID1: 'raid1',
  RAID5: 'raid5',
  RAID10: 'raid10',
} as const
export type RaidLevel = (typeof RAID_LEVELS)[keyof typeof RAID_LEVELS]
