'use client'

import { DataTable, EmptyState, InlineStat } from '@/components/ui'
import type { DataTableHeader } from '@/components/ui'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'
import { DiskCardGrid } from '../disk-card-grid'

interface LocalStorageSectionProps {
  disks: DiskModel[]
  pools: StoragePoolModel[]
  poolColumns: DataTableHeader<StoragePoolModel>[]
  onDiskClick: (disk: DiskModel) => void
  onPoolOpenFiles: (pool: StoragePoolModel) => void
}

export function LocalStorageSection({
  disks,
  pools,
  poolColumns,
  onDiskClick,
  onPoolOpenFiles,
}: LocalStorageSectionProps) {
  const used = disks.filter((disk) => disk.inUse).length
  const diskStats = { total: disks.length, used, unused: disks.length - used }

  return (
    <div className="space-y-8 pt-2">
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <h2 className="text-app-text text-sm font-semibold">本地磁盘</h2>
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            <InlineStat label="总共" value={diskStats.total} className="pl-0" />
            <InlineStat label="已使用" value={diskStats.used} divided />
            <InlineStat label="未使用" value={diskStats.unused} divided className="pr-0" />
          </div>
        </div>
        {disks.length === 0 ? (
          <EmptyState message="暂无本地硬盘" />
        ) : (
          <DiskCardGrid disks={disks} onDiskClick={onDiskClick} />
        )}
      </div>

      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <h2 className="text-app-text text-sm font-semibold">本地存储池</h2>
            </div>
          </div>
          <InlineStat label="总共" value={pools.length} className="px-0" />
        </div>
        {pools.length === 0 ? (
          <EmptyState message="暂无本地存储池" />
        ) : (
          <DataTable
            showHeader={false}
            headers={poolColumns}
            data={pools}
            variant="plain"
            getRowClassName={() => 'cursor-pointer'}
            onRowClickAction={(_, pool) => onPoolOpenFiles(pool)}
          />
        )}
      </div>
    </div>
  )
}
