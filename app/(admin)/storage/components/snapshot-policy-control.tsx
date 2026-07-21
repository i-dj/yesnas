import { Button, Checkbox } from '@/components/ui'
import { cn } from '@/lib/utils'

const weekdayOptions = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' },
] as const

export const defaultSnapshotWeekdays = weekdayOptions.map((option) => option.value)

export function SnapshotPolicyControl({
  weekdays,
  disabled = false,
  saving = false,
  directSelection = false,
  dirty = false,
  onWeekdaysChange,
  onSave,
}: {
  weekdays: number[]
  disabled?: boolean
  saving?: boolean
  directSelection?: boolean
  dirty?: boolean
  onWeekdaysChange: (weekdays: number[]) => void
  onSave?: () => void
}) {
  const toggleWeekday = (weekday: number) => {
    const next = weekdays.includes(weekday)
      ? weekdays.filter((item) => item !== weekday)
      : [...weekdays, weekday].sort((a, b) => a - b)
    onWeekdaysChange(next)
  }

  return (
    <section className="w-full">
      <div className="flex items-center justify-between gap-4">
        <div className="text-app-text text-base font-semibold">自动创建快照</div>
      </div>

      <div className={cn('bg-app-bg border-app-border mt-3 w-full rounded-lg border p-3', !directSelection && 'ml-6')}>
        <div className="bg-app-hover/35 grid w-full grid-cols-7 gap-px overflow-hidden rounded-md">
          {weekdayOptions.map((option) => {
            const selected = weekdays.includes(option.value)
            return (
              <Checkbox
                key={option.value}
                disabled={disabled || saving}
                variant="card"
                label={option.label}
                checked={selected}
                onChange={() => toggleWeekday(option.value)}
                className="bg-app-bg/45 hover:bg-app-hover h-9 min-w-0 rounded-none border-0 px-2 py-0"
                contentClassName="text-sm font-medium"
                markClassName="size-4"
              />
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-app-text-muted text-xs">
            {weekdays.length > 0 ? '将在所选日期每天晚上 12:00 自动创建快照' : '请选择自动创建快照的日期'}
          </p>
          {onSave && (
            <Button type="button" size="sm" loading={saving} disabled={disabled || saving || !dirty} onClick={onSave}>
              保存
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
