import type { LucideIcon } from 'lucide-react'
import { MiniDonut } from './mini-donut'

export function CompactResourceCard({
  icon: Icon,
  title,
  value,
  note,
  color,
  percent,
  details,
}: {
  icon: LucideIcon
  title: string
  value: string
  note: string
  color: string
  percent: number
  details: string[][]
}) {
  return (
    <div className="border-app-border bg-app-hover/30 rounded-lg p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-app-text flex flex-row items-center justify-center gap-2 truncate text-sm font-semibold">
            {title}
            <p className="text-app-text-muted truncate text-sm">{note}</p>
          </h3>
        </div>
        <Icon className="text-app-text-muted size-3.5 shrink-0" />
      </div>

      <div className="flex items-center gap-4">
        <MiniDonut percent={percent} color={color} value={value} />

        <div className="min-w-0 flex-1">
          <div className="grid gap-y-1.5">
            {details.map(([label, detail]) => (
              <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm">
                <span className="text-app-text-muted truncate">{label}</span>
                <span className="text-app-text truncate font-semibold">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
