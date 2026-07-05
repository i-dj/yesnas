'use client'

import { useMemo } from 'react'
import type { DataTableHeader } from '@/components/ui'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'
import type { PoolSource } from '../../types'
import { LocalStorageSection } from './local-storage-section'
import { NetworkStorageSection } from './network-storage-section'
import { RemovableStorageSection } from './removable-storage-section'

interface StorageContentProps {
  source: PoolSource
  pools: StoragePoolModel[]
  disks: DiskModel[]
  poolColumns: DataTableHeader<StoragePoolModel>[]
  onDiskClick: (disk: DiskModel) => void
  onPoolOpenFiles: (pool: StoragePoolModel) => void
}

export function StorageContent({
  source,
  pools,
  disks,
  poolColumns,
  onDiskClick,
  onPoolOpenFiles,
}: StorageContentProps) {
  const visiblePools = useMemo(
    () =>
      pools.filter((pool) => {
        const kind = String(pool.kind || (pool as StoragePoolModel & { type?: string }).type || 'local').toLowerCase()
        const hasRemovableDevice = pool.devices?.some((device) => device.removable || device.hotplug)
        if (source === 'network') return kind === 'cloud' || kind === 'network'
        if (source === 'removable') return kind === 'external' || kind === 'removable' || hasRemovableDevice
        return (
          kind !== 'cloud' && kind !== 'network' && kind !== 'external' && kind !== 'removable' && !hasRemovableDevice
        )
      }),
    [pools, source],
  )

  const sourceDisks = useMemo(
    () =>
      disks.filter((disk) =>
        source === 'removable' ? disk.removable || disk.hotplug : !disk.removable && !disk.hotplug,
      ),
    [disks, source],
  )

  if (source === 'network') {
    return <NetworkStorageSection pools={visiblePools} poolColumns={poolColumns} onPoolOpenFiles={onPoolOpenFiles} />
  }

  if (source === 'removable') {
    return <RemovableStorageSection disks={sourceDisks} onDiskClick={onDiskClick} />
  }

  return (
    <LocalStorageSection
      disks={sourceDisks}
      pools={visiblePools}
      poolColumns={poolColumns}
      onDiskClick={onDiskClick}
      onPoolOpenFiles={onPoolOpenFiles}
    />
  )
}
