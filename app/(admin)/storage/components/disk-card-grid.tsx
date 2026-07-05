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
              'group flex min-h-28 min-w-0 flex-col overflow-hidden rounded-xl border text-left transition-colors',
            )}
            onClick={() => onDiskClick(disk)}
          >
            <div className="border-app-border/70 flex min-w-0 items-center justify-between gap-2 border-b px-4 py-3">
              <h3 className="text-app-text min-w-0 truncate text-[13px] font-semibold">
                {disk.model || disk.name || disk.path}
              </h3>
              <StatusPill color={usage.color} content={usage.label} />
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between px-4 py-2">
              <div className="text-app-text text-xl leading-none font-semibold tracking-tight tabular-nums">
                {bytesFormat(disk.sizeBytes, { standard: 's', decimalPlaces: 2 })}
              </div>

              <div className="text-app-text-muted min-w-0 truncate text-[13px]">SN: {disk.serial || '无序列号'}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
