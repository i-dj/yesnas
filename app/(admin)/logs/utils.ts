import type { Log, LogHeatmapRange, LogHeatmapResponse, LogSeverity } from '@/types'
import { parseApiDate } from '@/lib/utils'

export const DEFAULT_RANGE: LogHeatmapRange = '90d'
export const PAGE_SIZE_OPTIONS = [20, 50, 100, 200] as const
const HEATMAP_RANGES: LogHeatmapRange[] = ['24h', '7d', '30d', '90d', '1y']

export function parseRange(value: string | null): LogHeatmapRange {
  return HEATMAP_RANGES.includes(value as LogHeatmapRange) ? (value as LogHeatmapRange) : DEFAULT_RANGE
}

export function parsePage(value: string | null) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export function parsePageSize(value: string | null) {
  const parsed = Number(value)
  return PAGE_SIZE_OPTIONS.includes(parsed as (typeof PAGE_SIZE_OPTIONS)[number]) ? parsed : PAGE_SIZE_OPTIONS[0]
}

export function parseSeverity(value: string | null): LogSeverity | 'all' {
  return value === 'info' || value === 'warn' || value === 'error' ? value : 'all'
}

export function parseSuccess(value: string | null) {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export function addFailureCounts(heatmap: LogHeatmapResponse, failedLogs: Log[]): LogHeatmapResponse {
  const counts = new Map<string, number>()
  failedLogs.forEach((log) => {
    const key = formatLogBucket(log.occurredAt, heatmap.bucket)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return {
    ...heatmap,
    buckets: heatmap.buckets.map((bucket) => ({ ...bucket, failedCount: counts.get(bucket.time) ?? 0 })),
  }
}

function formatLogBucket(occurredAt: string, bucket: LogHeatmapResponse['bucket']) {
  const date = parseApiDate(occurredAt)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  if (bucket === 'month') return `${year}-${month}`
  const day = String(date.getUTCDate()).padStart(2, '0')
  if (bucket === 'day') return `${year}-${month}-${day}`
  const hour = String(date.getUTCHours()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:00:00`
}
