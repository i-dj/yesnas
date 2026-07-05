import { isHealthyHealth, isRiskHealth, normalizeHealthState } from '@/lib/health'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'

export type StorageBadgeColor = 'success' | 'warning' | 'danger' | 'neutral'

export const EMPTY_VALUE = '-'

export const displayValue = (value: unknown, fallback = EMPTY_VALUE): string => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

export const displayNumber = (value: unknown, fallback = EMPTY_VALUE): string =>
  typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString() : fallback

export const displayPercent = (value: unknown, fallback = EMPTY_VALUE): string =>
  typeof value === 'number' && Number.isFinite(value) ? `${value}%` : fallback

export const displayTemperature = (value: unknown, fallback = EMPTY_VALUE): string =>
  typeof value === 'number' && Number.isFinite(value) ? `${value}°C` : fallback

export const toUpperDisplay = (value: unknown, fallback = EMPTY_VALUE): string => displayValue(value, fallback).toUpperCase()

export const getDiskUsageBadge = (disk: Pick<DiskModel, 'inUse' | 'isSystemDisk'>) => {
  if (disk.isSystemDisk) return { color: 'neutral' as const, label: '系统盘' }
  return disk.inUse ? { color: 'warning' as const, label: '已使用' } : { color: 'success' as const, label: '可用' }
}

export const getLocalHealthBadge = (health: string) => {
  const normalized = normalizeHealthState(health)
  return {
    content: normalized.toUpperCase(),
    color:
      normalized === 'healthy'
        ? ('success' as const)
        : normalized === 'error'
          ? ('danger' as const)
          : ('warning' as const),
  }
}

export const getCloudStatusBadge = (pool: StoragePoolModel) => {
  const status = String(pool.status || (pool.mounted ? 'online' : 'offline')).toLowerCase()
  const online = status === 'online' || status === 'mounted' || pool.mounted
  return {
    content: online ? 'ONLINE' : 'OFFLINE',
    color: online ? ('success' as const) : ('warning' as const),
  }
}

export const getPoolMemberStatus = (device: StoragePoolModel['devices'][number]) => {
  const state = String(device.state || '').toUpperCase()
  const health = String(device.health || '').toLowerCase()

  if (state === 'OFFLINE') return { text: 'OFFLINE', color: 'danger' as const, atRisk: true }
  if (state === 'DEGRADED') return { text: 'DEGRADED', color: 'warning' as const, atRisk: true }
  if (state === 'REBUILDING' || state === 'RESYNCING') return { text: state, color: 'warning' as const, atRisk: false }

  if (state === 'ONLINE') {
    if (isRiskHealth(health)) return { text: toUpperDisplay(device.health, 'WARNING'), color: 'danger' as const, atRisk: true }
    return {
      text: 'ONLINE',
      color: isHealthyHealth(health) ? ('success' as const) : ('neutral' as const),
      atRisk: false,
    }
  }

  if (isRiskHealth(health)) return { text: toUpperDisplay(device.health, 'FAILED'), color: 'danger' as const, atRisk: true }
  return { text: 'UNKNOWN', color: 'warning' as const, atRisk: false }
}

export const getStoragePoolCondition = (pool: StoragePoolModel) => {
  const members = pool.devices ?? []
  const states = members.map((device) => String(device.state || '').toUpperCase())

  if (pool.kind === 'cloud' && !pool.mounted) {
    return { label: 'WARNING', detail: '云盘本地挂载已断开', color: 'warning' as const }
  }
  if (states.includes('OFFLINE')) {
    return { label: 'WARNING', detail: '部分磁盘离线', color: 'danger' as const }
  }
  if (states.includes('DEGRADED') || String(pool.status || '').toLowerCase() === 'degraded') {
    return { label: 'WARNING', detail: '部分磁盘异常', color: 'warning' as const }
  }
  if (states.includes('REBUILDING') || states.includes('RESYNCING')) {
    return { label: 'WARNING', detail: '磁盘正在重建/同步中', color: 'warning' as const }
  }
  if (members.some((device) => isRiskHealth(device.health))) {
    return { label: 'WARNING', detail: '检测到磁盘健康告警', color: 'warning' as const }
  }
  if (isHealthyHealth(pool.health)) {
    return { label: 'HEALTHY', detail: '所有磁盘状态正常', color: 'success' as const }
  }
  return { label: 'UNKNOWN', detail: '状态未知', color: 'neutral' as const }
}

export type CloudProviderKey = 'google-drive' | 'onedrive' | 'dropbox' | 'cloud'

export const toNetworkStoragePool = (storageId: string, storage?: Record<string, unknown>): StoragePoolModel => {
  const id = String(storage?.id ?? storageId)
  const status = String(storage?.status ?? 'online')
  const mountPath = String(storage?.mountPath ?? '')
  const provider = String(storage?.provider ?? 'google_drive')

  return {
    id,
    storageId: id,
    name: String(storage?.name ?? 'Google Drive'),
    kind: String(storage?.kind ?? storage?.type ?? 'cloud'),
    filesystem: provider.replaceAll('_', ' '),
    raidLevel: '',
    mountPath,
    dataPath: mountPath,
    createdAt: String(storage?.createdAt ?? ''),
    updatedAt: String(storage?.updatedAt ?? ''),
    devices: [],
    status,
    health: status === 'online' ? 'healthy' : 'unknown',
    mounted: status === 'online',
    totalBytes: Number(storage?.totalBytes ?? 0),
    usedBytes: Number(storage?.usedBytes ?? 0),
    freeBytes: Number(storage?.freeBytes ?? 0),
    usagePercent: Number(storage?.usagePercent ?? 0),
    dataProfile: '',
    metadataProfile: '',
    systemProfile: '',
    snapshotCount: 0,
    snapshots: [],
    warnings: [],
    lastCheckedAt: String(storage?.lastCheckedAt ?? ''),
  }
}

export const getCloudProviderKey = (pool: StoragePoolModel): CloudProviderKey => {
  const record = pool as StoragePoolModel & {
    provider?: string
    type?: string
  }
  const raw = [record.provider, pool.filesystem, pool.kind, record.type].filter(Boolean).join(' ').toLowerCase()

  if (raw.includes('google')) return 'google-drive'
  if (raw.includes('onedrive') || raw.includes('one_drive') || raw.includes('microsoft')) return 'onedrive'
  if (raw.includes('dropbox')) return 'dropbox'
  return 'cloud'
}

export const getCloudProviderLogoSrc = (provider: CloudProviderKey) => {
  if (provider === 'google-drive') return '/logos/cloud-storage/google-drive.png'
  if (provider === 'onedrive') return '/logos/cloud-storage/onedrive.svg'
  if (provider === 'dropbox') return '/logos/cloud-storage/dropbox.png'
  return ''
}

export const getCloudAccountLabel = (pool: StoragePoolModel) => {
  const record = pool as StoragePoolModel & {
    accountEmail?: string
    email?: string
    username?: string
    accountName?: string
    account?: string | { email?: string; name?: string; username?: string }
    user?: string | { email?: string; name?: string; username?: string }
  }

  if (typeof record.account === 'object' && record.account) {
    return record.account.email || record.account.username || record.account.name || ''
  }
  if (typeof record.user === 'object' && record.user) {
    return record.user.email || record.user.username || record.user.name || ''
  }

  return (
    record.accountEmail ||
    record.email ||
    record.username ||
    record.accountName ||
    (typeof record.account === 'string' ? record.account : '') ||
    (typeof record.user === 'string' ? record.user : '')
  )
}
