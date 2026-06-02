import { request } from '@/lib/api/request'
import { createCrudApi } from './crud'
import { StoragePoolModel } from '@/types/models/storage'
import type { RaidLevel } from '@/types/models/_constants'

export interface CreateStoragePoolPayload {
  name: string
  raidLevel: RaidLevel
  paths: string[]
}

export const storageApi = {
  ...createCrudApi<StoragePoolModel>('/system/storage-pools'),

  createPool: (payload: CreateStoragePoolPayload) =>
    request<StoragePoolModel>('/system/storage-pools', {
      method: 'POST',
      body: payload,
    }),

  // get snapshot
  snapshots: (poolId: string) => request(`/system/storage-pools/${poolId}/snapshots`),

  // create snapshot
  createSnapshot: (poolId: string, payload: any) =>
    request(`/system/storage-pools/${poolId}/snapshots`, {
      method: 'POST',
      body: payload,
    }),

  // pool format
  formatPool: (poolId: string, payload: { password: string }) =>
    request<{ pool?: StoragePoolModel }>(`/system/storage-pools/${poolId}/format`, {
      method: 'POST',
      body: payload,
    }),

  // disk replace
  replaceDisk: (poolId: string, payload: { oldDevicePath: string; newDevicePath: string; password: string }) =>
    request<void>(`/system/storage-pools/${poolId}/replace-disk`, {
      method: 'POST',
      body: payload,
    }),

  // restore snapshot
  restoreSnapshot: (poolId: string, snapshotId: string, payload: any) =>
    request<{ name?: string }>(`/system/storage-pools/${poolId}/snapshots/${snapshotId}/restore`, {
      method: 'POST',
      body: {
        password: payload.password,
        createBackup: payload.createBackup ?? true,
      },
    }),
}
