'use client'

import type { LogHeatmapRange, LogHeatmapResponse } from '@/types'
import { cn } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'

import { ToggleButton } from '@/components/ui'

const ranges = ['24h', '7d', '30d', '90d', '1y'] as const
export type LogTimeRange = LogHeatmapRange | 'custom'
const rangeOptions: readonly LogTimeRange[] = ranges
const intensityClasses = [
  'bg-app-hover/45',
  'bg-sky-500/15',
  'bg-sky-500/30',
  'bg-sky-500/50',
  'bg-sky-400/75',
] as const
const failedIntensityClasses = [
  'bg-app-hover/45',
  'bg-red-500/20',
  'bg-red-500/35',
  'bg-red-500/55',
  'bg-red-400/80',
] as const

export function LogHeatmap({
  data,
  range,
  loading,
  total,
  selectedBucket,
  rangeEnd,
  timeZone,
  onRangeChange,
  onBucketClick,
}: {
  data: LogHeatmapResponse
  range: LogTimeRange
  loading: boolean
  total: number
  selectedBucket?: string
  rangeEnd: string
  timeZone: string
  onRangeChange: (range: LogTimeRange) => void
  onBucketClick: (time: string, bucket: LogHeatmapResponse['bucket']) => void
}) {
  const t = useTranslations('Logs')
  const locale = useLocale()
  const buckets = fillHeatmapBuckets(data, rangeEnd)
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1)
  const columns = getHeatmapColumns(data.range)
  const items: Array<{ value: LogTimeRange; label: string }> = rangeOptions.map((value) => ({
    value,
    label: t(`ranges.${value}`),
  }))

  return (
    <section className="border-app-border/60 border-b pb-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <ToggleButton
          items={items}
          value={range}
          onChange={onRangeChange}
          showSeparator={false}
          shape="rounded"
          className="h-8 border-none bg-transparent"
          itemClassName="px-2"
        />
        <div className="flex items-baseline gap-1.5">
          <span className="text-app-text font-semibold">{total}</span>
          <span className="app-caption text-app-text-muted">{t('total')}</span>
        </div>
      </div>

      <div className={cn('transition-opacity', loading && 'opacity-45')}>
        <div className="grid w-full gap-1" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {buckets.map((bucket) => {
            const intensity = bucket.count === 0 ? 0 : Math.max(1, Math.ceil((bucket.count / max) * 4))
            const colors = bucket.failedCount ? failedIntensityClasses : intensityClasses
            return (
              <button
                type="button"
                key={bucket.time}
                title={t('activity.tooltip', {
                  time: formatHeatmapTime(bucket.time, data.bucket, locale, timeZone),
                  count: bucket.count,
                  failed: bucket.failedCount ?? 0,
                })}
                onClick={() => onBucketClick(bucket.time, data.bucket)}
                className={cn(
                  'h-5 min-w-0 rounded-[3px] transition-all outline-none',
                  colors[intensity],
                  selectedBucket === bucket.time && 'ring-app-text ring-offset-app-bg ring-1 ring-offset-1',
                )}
              />
            )
          })}
        </div>
        <div className="app-micro-label text-app-text-muted mt-1.5 flex w-full justify-between">
          <span>{formatHeatmapTime(buckets.at(0)?.time, data.bucket, locale, timeZone)}</span>
          <span>{formatHeatmapTime(buckets.at(-1)?.time, data.bucket, locale, timeZone)}</span>
        </div>
      </div>
    </section>
  )
}

function fillHeatmapBuckets(data: LogHeatmapResponse, rangeEnd: string) {
  const bucketCount: Record<LogHeatmapRange, number> = { '24h': 24, '7d': 7, '30d': 30, '90d': 90, '1y': 12 }
  const sourceBuckets = data.buckets ?? []
  const bucketsByTime = new Map(sourceBuckets.map((bucket) => [bucket.time, bucket]))
  const cursor = parseBucketTime(rangeEnd || sourceBuckets.at(-1)?.time, data.bucket)
  const buckets = []

  for (let offset = bucketCount[data.range] - 1; offset >= 0; offset -= 1) {
    const date = new Date(cursor)
    if (data.bucket === 'hour') date.setUTCHours(cursor.getUTCHours() - offset, 0, 0, 0)
    if (data.bucket === 'day') date.setUTCDate(cursor.getUTCDate() - offset)
    if (data.bucket === 'month') date.setUTCMonth(cursor.getUTCMonth() - offset, 1)

    const time = formatBucketTime(date, data.bucket)
    const source = bucketsByTime.get(time)
    buckets.push({ time, count: source?.count ?? 0, failedCount: source?.failedCount ?? 0 })
  }

  return buckets
}

function getHeatmapColumns(range: LogHeatmapRange) {
  if (range === '90d') return 30
  if (range === '24h') return 24
  if (range === '30d') return 30
  if (range === '7d') return 7
  return 12
}

function parseBucketTime(value: string | undefined, bucket: LogHeatmapResponse['bucket']) {
  if (!value) return new Date()
  if (bucket === 'month') return new Date(`${value.slice(0, 7)}-01T00:00:00Z`)
  if (bucket === 'day') return new Date(`${value.slice(0, 10)}T00:00:00Z`)
  return new Date(`${value.slice(0, 13)}:00:00Z`)
}

function formatBucketTime(date: Date, bucket: LogHeatmapResponse['bucket']) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  if (bucket === 'month') return `${year}-${month}`

  const day = String(date.getUTCDate()).padStart(2, '0')
  if (bucket === 'day') return `${year}-${month}-${day}`

  const hour = String(date.getUTCHours()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:00:00`
}

function formatHeatmapTime(
  value: string | undefined,
  bucket: LogHeatmapResponse['bucket'],
  locale: string,
  timeZone: string,
) {
  if (!value) return '-'
  const date = parseBucketTime(value, bucket)
  if (Number.isNaN(date.getTime())) return value

  if (bucket === 'hour') {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }
  if (bucket === 'month')
    return new Intl.DateTimeFormat(locale, { timeZone, year: 'numeric', month: 'short' }).format(date)
  return new Intl.DateTimeFormat(locale, { timeZone, year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}
