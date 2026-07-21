import { formatBytesPerSecond, formatOptionalNumber } from '@/lib/utils'
import type { HardwareDisk } from '@/types'

export const formatOptional = formatOptionalNumber
export const formatSpeed = formatBytesPerSecond

export function isHealthyDisk(disk: HardwareDisk) {
  return ['passed', 'healthy'].includes(disk.health?.toLowerCase() ?? '')
}

export function formatDiskUsage(usage: string | undefined, t: (key: string) => string) {
  if (usage === 'system') return t('diskUsage.system')
  if (usage === 'storage_pool') return t('diskUsage.storagePool')
  if (usage === 'mixed') return t('diskUsage.mixed')
  if (usage === 'unused') return t('statuses.unused')
  return usage || '-'
}
