'use client'

import { useRouter } from 'next/navigation'
import { storageApi } from '@/lib/api/storage.api'
import { runWithToast } from '@/lib/run-with-toast'
import { toast } from '@/store/use-toast-store'
import type { RaidLevel } from '@/types/models/_constants'
import type { StoragePoolModel } from '@/types/models/storage'

interface StorageActionsOptions {
  onPoolDeleted?: (poolId: string) => void
  onPoolFormatted?: (pool: StoragePoolModel) => void
  onPoolUpdated?: (pool: StoragePoolModel) => void
}

export interface CreatePoolPayload {
  name: string
  raidLevel: RaidLevel
  diskIds: string[]
  autoSnapshotEnabled: boolean
  autoSnapshotWeekdays: number[]
}

export interface SnapshotPayload {
  name: string
  sourcePath?: string
  description?: string
  readOnly?: boolean
}

export interface RestoreSnapshotPayload {
  password: string
  createBackup: boolean
}

export interface ReplaceDiskPayload {
  oldDevicePath: string
  newDevicePath: string
  password: string
}

export interface SnapshotPolicyPayload {
  autoSnapshotEnabled: boolean
  autoSnapshotWeekdays: number[]
}

const reject = (message: string) => {
  toast.error(message)
  return false
}

const rejectAndThrow = (message: string, errorMessage = message) => {
  toast.error(message)
  throw new Error(errorMessage)
}

export function useStorageActions({ onPoolDeleted, onPoolFormatted, onPoolUpdated }: StorageActionsOptions = {}) {
  const router = useRouter()

  const createPool = (payload: CreatePoolPayload) =>
    runWithToast({
      task: () =>
        storageApi.createPool({
          name: payload.name,
          raidLevel: payload.raidLevel,
          paths: payload.diskIds,
          autoSnapshotEnabled: payload.autoSnapshotEnabled,
          autoSnapshotSchedule: payload.autoSnapshotEnabled ? payload.autoSnapshotWeekdays.join('') : '',
        }),
      success: `Storage pool created: ${payload.name}`,
      fail: 'Create pool failed',
      onSuccess: () => router.refresh(),
    })

  const deletePool = (poolId: string, poolName: string) =>
    runWithToast({
      task: () => storageApi.remove(poolId),
      success: `Storage pool deleted: ${poolName}`,
      fail: 'Delete pool failed',
      onSuccess: () => {
        onPoolDeleted?.(poolId)
        router.refresh()
      },
    })

  const createSnapshot = async (pool: StoragePoolModel, payload: SnapshotPayload) => {
    const trimmedName = payload.name.trim()
    if (!trimmedName) return reject('Create snapshot failed: Snapshot name is required.')

    return runWithToast({
      task: () =>
        storageApi.createSnapshot(pool.id, {
          name: trimmedName,
          sourcePath: payload.sourcePath ?? '',
          description: payload.description?.trim() ?? '',
          readOnly: payload.readOnly ?? true,
        }),
      success: `Snapshot created: ${pool.name} · ${trimmedName}`,
      fail: 'Create snapshot failed',
      onSuccess: () => router.refresh(),
    })
  }

  const formatPool = async (pool: StoragePoolModel, password: string) => {
    const trimmedPassword = password.trim()
    if (!trimmedPassword) return reject('Format pool failed: Password is required.')

    return runWithToast({
      task: () => storageApi.formatPool(pool.id, { password: trimmedPassword }),
      success: `Pool formatted: ${pool.name}`,
      fail: 'Format pool failed',
      onSuccess: (result) => {
        if (result.pool) {
          onPoolFormatted?.(result.pool)
        }
        router.refresh()
      },
    })
  }

  const restoreSnapshot = async (pool: StoragePoolModel, snapshotId: string, payload: RestoreSnapshotPayload) => {
    if (!payload.password) rejectAndThrow('Restore snapshot failed: Please input password', 'Please input password')

    await runWithToast({
      task: () => storageApi.restoreSnapshot(pool.id, snapshotId, payload),
      fail: 'Restore snapshot failed',
      onSuccess: (result) => {
        toast.success(result.name ? `Snapshot restored: ${result.name}` : 'Snapshot restored')
        router.refresh()
      },
      rethrow: true,
    })
  }

  const updateSnapshotPolicy = async (pool: StoragePoolModel, payload: SnapshotPolicyPayload) =>
    runWithToast({
      task: () =>
        storageApi.updateSnapshotPolicy(pool.id, {
          autoSnapshotEnabled: payload.autoSnapshotEnabled,
          autoSnapshotSchedule: payload.autoSnapshotEnabled ? payload.autoSnapshotWeekdays.join('') : '',
        }),
      success: `Snapshot policy updated: ${pool.name}`,
      fail: 'Update snapshot policy failed',
      onSuccess: (result) => {
        onPoolUpdated?.(result)
        router.refresh()
      },
    })

  const replaceDisk = async (pool: StoragePoolModel, payload: ReplaceDiskPayload) => {
    if (!payload.password?.trim()) rejectAndThrow('Replace disk failed: Password is required.', 'Password is required')
    if (!payload.newDevicePath?.trim()) {
      rejectAndThrow('Replace disk failed: Please select a replacement disk.', 'Replacement disk is required')
    }

    const ok = await runWithToast({
      task: () =>
        storageApi.replaceDisk(pool.id, {
          password: payload.password,
          oldDevicePath: payload.oldDevicePath,
          newDevicePath: payload.newDevicePath,
        }),
      success: `Disk replacement started: ${payload.oldDevicePath} -> ${payload.newDevicePath}`,
      fail: 'Replace disk failed',
      onSuccess: () => router.refresh(),
    })

    if (!ok) throw new Error('Replace disk failed')
  }

  return {
    createPool,
    deletePool,
    createSnapshot,
    updateSnapshotPolicy,
    formatPool,
    restoreSnapshot,
    replaceDisk,
  }
}
