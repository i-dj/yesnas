'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'

export function useStorageTable({
  diskList,
  storagePools,
}: {
  diskList: DiskModel[]
  storagePools: StoragePoolModel[]
}) {
  const [poolList, setPoolList] = useState<StoragePoolModel[]>(storagePools)

  useEffect(() => {
    setPoolList(storagePools)
  }, [storagePools])
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

  const updatePool = (nextPool: Partial<StoragePoolModel> & Pick<StoragePoolModel, 'id'>) => {
    setPoolList((current) =>
      current.map((pool) =>
        pool.id === nextPool.id
          ? {
              ...pool,
              ...nextPool,
            }
          : pool,
      ),
    )
  }

  const upsertPool = (nextPool: StoragePoolModel) => {
    setPoolList((current) => {
      const index = current.findIndex((pool) => pool.id === nextPool.id || pool.storageId === nextPool.storageId)
      if (index === -1) return [nextPool, ...current]

      return current.map((pool, poolIndex) =>
        poolIndex === index
          ? {
              ...pool,
              ...nextPool,
            }
          : pool,
      )
    })
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
    poolList,
    replaceCandidates,
    removePool,
    updatePool,
    upsertPool,
    updatePoolBenchmark,
  }
}
