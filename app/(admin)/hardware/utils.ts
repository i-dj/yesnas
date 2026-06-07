import { formatBytes } from '@/lib/utils'
import type { HardwareDisk } from '@/types'

export function formatOptional(value: number | null | undefined, suffix: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}${suffix}`
}

export function formatSpeed(bytesPerSecond: number) {
  return `${formatBytes(bytesPerSecond)}/s`
}

export function isHealthyDisk(disk: HardwareDisk) {
  return ['passed', 'healthy'].includes(disk.health.toLowerCase())
}

export function formatDiskUsage(usage: string | undefined, t: (key: string) => string) {
  if (usage === 'system') return t('diskUsage.system')
  if (usage === 'storage_pool') return t('diskUsage.storagePool')
  if (usage === 'mixed') return t('diskUsage.mixed')
  if (usage === 'unused') return t('statuses.unused')
  return usage || '-'
}
