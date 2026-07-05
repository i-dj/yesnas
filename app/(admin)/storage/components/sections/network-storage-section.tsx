'use client'

import { DataTable, EmptyState } from '@/components/ui'
import type { DataTableHeader } from '@/components/ui'
import type { StoragePoolModel } from '@/types/models/storage'

interface NetworkStorageSectionProps {
  pools: StoragePoolModel[]
  poolColumns: DataTableHeader<StoragePoolModel>[]
  onPoolOpenFiles: (pool: StoragePoolModel) => void
}

export function NetworkStorageSection({ pools, poolColumns, onPoolOpenFiles }: NetworkStorageSectionProps) {
  if (pools.length === 0) return <EmptyState message="暂无网络存储" />

  return (
    <DataTable
      showHeader={false}
      headers={poolColumns}
      data={pools}
      variant="primary"
      getRowClassName={() => 'cursor-pointer'}
      onRowClickAction={(_, pool) => onPoolOpenFiles(pool)}
    />
  )
}
