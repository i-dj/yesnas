'use client'

import { EmptyState } from '@/components/ui'
import type { DiskModel } from '@/types/models/storage'
import { DiskCardGrid } from '../disk-card-grid'

interface RemovableStorageSectionProps {
  disks: DiskModel[]
  onDiskClick: (disk: DiskModel) => void
}

export function RemovableStorageSection({ disks, onDiskClick }: RemovableStorageSectionProps) {
  if (disks.length === 0) return <EmptyState message="暂无可移动存储" />

  return <DiskCardGrid disks={disks} onDiskClick={onDiskClick} />
}
