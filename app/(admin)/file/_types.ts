import { FileNode } from '@nextdj/file-explorer'

export type StorageLocation = 'local' | 'cloud' | 'external'
export type QuickFilterType = 'trash' | 'favorites'

export interface FileCategoryColor {
  bgClass: string
}
