import { STORAGE_TYPES } from '@/types/models/_constants'
import type { CategoryColor } from '@nextdj/file-explorer'

import { Cloud, HardDrive, Network, Server, Star, Trash2 } from 'lucide-react'
import { FileCategoryColor, QuickFilterType, StorageLocation } from './_types'

export const STORAGE_TYPE_META = {
  [STORAGE_TYPES.LOCAL]: { icon: HardDrive, color: 'gray' },
  [STORAGE_TYPES.GOOGLE]: { icon: Cloud, color: 'blue' },
  [STORAGE_TYPES.WEBDAV]: { icon: Network, color: 'orange' },
  [STORAGE_TYPES.ONEDRIVE]: { icon: Cloud, color: 'sky' },
  [STORAGE_TYPES.SMB]: { icon: Server, color: 'indigo' },
  [STORAGE_TYPES.DROPBOX]: { icon: Server, color: 'red' },
} as const

export const STORAGE_LOCATIONS = [
  { value: 'local' },
  { value: 'cloud' },
  { value: 'external' },
] as const satisfies ReadonlyArray<{ value: StorageLocation }>

export const QUICK_FILTERS = [
  { value: 'trash', icon: Trash2 },
] as const satisfies ReadonlyArray<{ value: QuickFilterType; icon: typeof Trash2 }>

export const FILE_CATEGORY_COLORS = {
  red: { bgClass: 'bg-red-500' },
  blue: { bgClass: 'bg-blue-500' },
  green: { bgClass: 'bg-green-500' },
  yellow: { bgClass: 'bg-yellow-500' },
  gray: { bgClass: 'bg-gray-500' },
} satisfies Record<CategoryColor, FileCategoryColor>
