'use client'

import { Card, Progress } from '@/components/ui'
import { bytesFormat, cn } from '@/lib/utils'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { StorageDrive } from '@/types/models/file'

import { STORAGE_TYPE_META } from '../_constants'

export interface StorageIoStats {
  storageId: string
  readSpeed: number
  writeSpeed: number
}

interface StorageCardProps {
  storage: StorageDrive
  ioStats?: StorageIoStats
  ioError?: string
}

export const StorageCard = ({
  storage,
  ioStats,
  ioError,
}: StorageCardProps) => {
  const { name, type, freeSize, totalSize } = storage

  const meta = STORAGE_TYPE_META[type]
  const Icon = meta.icon
  const usedSize = totalSize - freeSize
  const progress = totalSize > 0 ? Math.round((usedSize / totalSize) * 100) : 0
  const uploadRate = ioStats?.writeSpeed ?? 0
  const downloadRate = ioStats?.readSpeed ?? 0
  const progressColorClass =
    progress >= 90
      ? 'bg-red-500'
      : progress >= 70
        ? 'bg-yellow-500'
        : 'bg-blue-500'

  return (
    <Card className="hover:border-app-border-strong flex w-60 cursor-pointer flex-col gap-3 hover:shadow-xs">
      <div className="flex items-start gap-3">
        <div className="text-app-text-muted bg-app-bg border-app-border rounded-sm border p-1.5">
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-app-text truncate text-xs font-semibold">
            {name}
          </div>
          <div
            className="text-app-text-muted mt-1 flex items-center gap-4 text-[10px] leading-none"
            title={ioError}
          >
            <div className="flex items-center gap-1">
              <ArrowUp size={12} strokeWidth={2} />
              <span>{bytesFormat(uploadRate)}/s</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowDown size={12} strokeWidth={2} />
              <span>{bytesFormat(downloadRate)}/s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-px">
        <Progress
          value={progress}
          showLabel={false}
          className={progressColorClass}
        />
        <div className="text-app-text-muted flex justify-between text-[10px] font-semibold tracking-tighter uppercase">
          <span>
            {bytesFormat(usedSize)} / {bytesFormat(totalSize)}
          </span>
          <span>{progress}%</span>
        </div>
      </div>
    </Card>
  )
}
