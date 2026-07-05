import { request } from '@/lib/api/request'
import { createCrudApi } from './crud'
import {
  CreateStoragePoolSnapshotPayload,
  RestoreStoragePoolSnapshotPayload,
  StoragePoolModel,
} from '@/types/models/storage'
import type { RaidLevel } from '@/types/models/_constants'

export interface CreateStoragePoolPayload {
  name: string
  raidLevel: RaidLevel
  paths: string[]
  autoSnapshotEnabled?: boolean
  autoSnapshotSchedule?: string
}

export interface UpdateStoragePoolSnapshotPolicyPayload {
  autoSnapshotEnabled: boolean
  autoSnapshotSchedule?: string
}

export const storageApi = {
  ...createCrudApi<StoragePoolModel>('/system/storage-pools'),

  listSilently: () =>
    request<StoragePoolModel[]>('/system/storage-pools', {
      unwrapList: true,
      silentNetworkLoading: true,
    }),

  createPool: (payload: CreateStoragePoolPayload) =>
    request<StoragePoolModel>('/system/storage-pools', {
      method: 'POST',
      body: payload,
    }),

  updateSnapshotPolicy: (poolId: string, payload: UpdateStoragePoolSnapshotPolicyPayload) =>
    request<Partial<StoragePoolModel>>(`/system/storage-pools/${poolId}`, {
      method: 'PUT',
      body: payload,
    }),

  // get snapshot
  snapshots: (poolId: string) => request(`/system/storage-pools/${poolId}/snapshots`),

  // create snapshot
  createSnapshot: (poolId: string, payload: CreateStoragePoolSnapshotPayload) =>
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
  restoreSnapshot: (poolId: string, snapshotId: string, payload: RestoreStoragePoolSnapshotPayload) =>
    request<{ name?: string }>(`/system/storage-pools/${poolId}/snapshots/${snapshotId}/restore`, {
      method: 'POST',
      body: {
        password: payload.password,
        createBackup: payload.createBackup ?? true,
      },
    }),
}
