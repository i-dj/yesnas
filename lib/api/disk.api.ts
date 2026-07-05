import { DiskModel } from '@/types'
import { createCrudApi } from './crud'

export const diskApi = {
  ...createCrudApi<DiskModel>('/system/disks'),
}
