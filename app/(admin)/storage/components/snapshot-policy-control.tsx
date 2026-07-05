import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Camera, Check } from 'lucide-react'

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
    <section>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Camera className="text-app-text-muted size-4 shrink-0" />
          <div className="app-section-title text-app-text">自动创建快照</div>
        </div>
      </div>

      <div className={cn('mt-2 max-w-lg', !directSelection && 'ml-6')}>
        <div className="border-app-border grid grid-cols-7 overflow-hidden rounded-md border">
          {weekdayOptions.map((option) => {
            const selected = weekdays.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled || saving}
                aria-pressed={selected}
                onClick={() => toggleWeekday(option.value)}
                className={cn(
                  'border-app-border text-app-text-muted relative h-7 min-w-0 border-r px-1.5 text-left last:border-r-0',
                  selected && 'bg-app-active text-app-text',
                )}
              >
                <span className="app-body-text relative z-10">{option.label}</span>
                {selected && (
                  <span className="absolute right-0 bottom-0 size-5 overflow-hidden">
                    <span className="border-b-app-text absolute right-0 bottom-0 h-0 w-0 border-b-20 border-l-20 border-l-transparent" />
                    <Check className="text-app-bg absolute right-0.5 bottom-0.5 size-2.5" strokeWidth={3} />
                  </span>
                )}
              </button>
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
