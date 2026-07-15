import { DriveStatus, StorageType } from './_constants'
import type { BreadcrumbItem, FileNode } from '@nextdj/file-explorer'

export type FileConflictPolicy = 'error' | 'overwrite' | 'rename'

export interface FileConflictResult {
  hasConflict: boolean
  name: string
  parentId: string
  targetId?: string
  targetType?: FileNode['type']
}

export interface FileConflictPayload {
  parentId: string
  name?: string
}

export interface FileTransferPayload extends FileConflictPayload {
  conflictPolicy?: FileConflictPolicy
}

export interface FileResponseData {
  breadcrumbs: BreadcrumbItem[]
  files: FileNode[]
}

export type FileQueryType = 'recent' | 'trash' | 'tag'

export interface GetFilesOptions {
  parentId?: string
  type?: FileQueryType
}

export interface TrashFileResponse {
  id: string
  storageId: string
  name: string
  type: FileNode['type']
  parentId?: string
  originalPath?: string
  recyclePath?: string
  deletedAt: string
  expiresAt?: string
  size?: number
  extension?: string
  isHidden?: boolean
  mimeType?: string
  mediaType?: string
  tagColors?: FileNode['tagColors']
}

export interface StorageDrive {
  id: string
  name: string // 驱动器自定义名称 (例如: "我的谷歌云端硬盘")
  // 核心连接信息
  type: StorageType // 存储类型
  source: string // 账号 email (如 google) 或 挂载 URL (如 webdav)
  location: string // cloud,云端，local本地

  username?: string
  // 容量管理 (建议使用 number 类型，单位统一为 Byte，前端再做格式化)
  freeSize: number // 已用空间 (Byte)
  totalSize: number // 总空间 (Byte)
  // progress 可以通过 (used / total) * 100 动态计算，不建议存在数据库

  // 状态监控
  status: DriveStatus // 当前连接状态
  statusText?: string // 报错时的具体信息 (例如: "Token 已过期")

  // 挂载点
  mountPath: string // 在 NAS 系统中的挂载路径 (例如: "/mnt/google_drive")

  // 时间维度
  createdAt: string | Date // 添加时间 (ISO 字符串或 Date 对象)
  updatedAt: string | Date // 最后一次同步/更新时间
}
