'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'

export const storageTabItems = [
  { value: 'all', label: '全部' },
  { value: 'used', label: '已使用' },
  { value: 'unused', label: '未使用' },
] as const

export type StorageTabValue = (typeof storageTabItems)[number]['value']
export type DiskTableRow = DiskModel & { id: string }

export function useStorageTable({
  diskList,
  storagePools,
}: {
  diskList: DiskModel[]
  storagePools: StoragePoolModel[]
}) {
  const [activeTab, setActiveTab] = useState<StorageTabValue>('all')
  const [poolList, setPoolList] = useState<StoragePoolModel[]>(storagePools)

  useEffect(() => {
    setPoolList(storagePools)
  }, [storagePools])

  const diskRows = useMemo<DiskTableRow[]>(() => {
    return diskList
      .filter((disk) => {
        if (activeTab === 'all') return true
        return activeTab === 'used' ? disk.inUse : !disk.inUse
      })
      .map((disk) => ({ ...disk, id: disk.path }))
  }, [activeTab, diskList])

  const diskStats = useMemo(() => {
    const total = diskList.length
    const available = diskList.filter((disk) => !disk.inUse).length
    return {
      total,
      available,
      inUse: total - available,
    }
  }, [diskList])

  const replaceCandidates = useMemo(() => {
    const items: Array<{
      path: string
      label: string
      sizeBytes: number
      kind: 'disk' | 'partition'
    }> = []

    for (const disk of diskList) {
      const usage = String(disk.usage || '').toLowerCase()
      if (usage === 'unused') {
        items.push({
          path: disk.path,
          label: disk.model || disk.name || disk.path,
          sizeBytes: disk.sizeBytes ?? 0,
          kind: 'disk',
        })
      }
      if (usage === 'mixed') {
        for (const part of disk.partitions ?? []) {
          if (String(part.usage || '').toLowerCase() !== 'unused') continue
          items.push({
            path: part.path,
            label: `${disk.model || disk.name || disk.path} (${part.name})`,
            sizeBytes: part.sizeBytes ?? 0,
            kind: 'partition',
          })
        }
      }
    }

    return items
  }, [diskList])

  const removePool = (poolId: string) => {
    setPoolList((current) => current.filter((pool) => pool.id !== poolId))
  }

  const updatePool = (nextPool: StoragePoolModel) => {
    setPoolList((current) => current.map((pool) => (pool.id === nextPool.id ? nextPool : pool)))
  }

  const updatePoolBenchmark = (
    poolId: string,
    data: {
      readSpeedBytesPerSec?: number
      writeSpeedBytesPerSec?: number
    },
  ) => {
    setPoolList((current) =>
      current.map((pool) =>
        pool.id === poolId
          ? {
              ...pool,
              readSpeedBytesPerSec: data.readSpeedBytesPerSec,
              writeSpeedBytesPerSec: data.writeSpeedBytesPerSec,
            }
          : pool,
      ),
    )
  }

  return {
    activeTab,
    setActiveTab,
    diskRows,
    diskStats,
    poolList,
    replaceCandidates,
    removePool,
    updatePool,
    updatePoolBenchmark,
  }
}
