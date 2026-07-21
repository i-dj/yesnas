import { StatusPill } from '@/components/ui'
import { bytesFormat, cn } from '@/lib/utils'
import type { DiskModel } from '@/types/models/storage'
import { getDiskUsageBadge } from '../utils'

interface DiskCardGridProps {
  disks: DiskModel[]
  onDiskClick: (disk: DiskModel) => void
}

export function DiskCardGrid({ disks, onDiskClick }: DiskCardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      {disks.map((disk) => {
        const usage = getDiskUsageBadge(disk)

        return (
          <button
            key={disk.path}
            type="button"
            className={cn(
              'border-app-border bg-app-hover/20 hover:border-app-border-strong hover:bg-app-hover/30',
              'group min-h-28 min-w-0 overflow-hidden rounded-xl border px-4 py-4 text-left transition-colors',
            )}
            onClick={() => onDiskClick(disk)}
          >
            <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
              <div className="text-app-text min-w-0 truncate text-xl leading-none font-semibold tracking-tight tabular-nums">
                {bytesFormat(disk.sizeBytes, { standard: 's', decimalPlaces: 2 })}
              </div>
              <StatusPill color={usage.color} content={usage.label} />
            </div>

            <div className="min-w-0 space-y-1">
              <h3 className="text-app-text truncate text-[13px] font-semibold">
                {disk.model || disk.name || disk.path}
              </h3>
              <div className="text-app-text-muted min-w-0 truncate text-[13px]">SN: {disk.serial || '无序列号'}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
