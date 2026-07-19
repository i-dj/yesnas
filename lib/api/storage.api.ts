import { request } from '@/lib/api/request'
import { createCrudApi } from './crud'
import {
  CreateStoragePoolPayload,
  CreateStoragePoolSnapshotPayload,
  FormatStoragePoolPayload,
  FormatStoragePoolResponse,
  ReplaceStoragePoolDevicePayload,
  RestoreStoragePoolSnapshotResponse,
  RestoreStoragePoolSnapshotPayload,
  StoragePoolModel,
  UpdateStoragePoolSnapshotPolicyPayload,
} from '@/types/models/storage'
import type { StorageDrive } from '@/types'

export const storageApi = {
  ...createCrudApi<StoragePoolModel>('/system/storage-pools'),

  listSilently: () =>
    request<StoragePoolModel[]>('/system/storage-pools', {
      unwrapList: true,
      silentNetworkLoading: true,
    }),

  listStorages: () => request<StorageDrive[]>('/storages', { unwrapList: true }),

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
  formatPool: (poolId: string, payload: FormatStoragePoolPayload) =>
    request<FormatStoragePoolResponse>(`/system/storage-pools/${poolId}/format`, {
      method: 'POST',
      body: payload,
    }),

  // disk replace
  replaceDisk: (poolId: string, payload: ReplaceStoragePoolDevicePayload) =>
    request<void>(`/system/storage-pools/${poolId}/devices/replace`, {
      method: 'POST',
      body: payload,
    }),

  // restore snapshot
  restoreSnapshot: (poolId: string, snapshotId: string, payload: RestoreStoragePoolSnapshotPayload) =>
    request<RestoreStoragePoolSnapshotResponse>(`/system/storage-pools/${poolId}/snapshots/${snapshotId}/restore`, {
      method: 'POST',
      body: {
        password: payload.password,
        createBackup: payload.createBackup ?? true,
      },
    }),
}
