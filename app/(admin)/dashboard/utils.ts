import {
  NetworkInterfaceSnapshot,
  NetworkInterfacesSnapshot,
  NetworkPoint,
  ProcessState,
  SystemState,
} from '@/types/models/dashboard'

export const statusLabelMap: Record<SystemState, string> = {
  healthy: '运行正常',
  warning: '需要关注',
  error: '异常',
  unknown: '未知',
}

export const healthLabelMap: Record<SystemState, string> = {
  healthy: '健康',
  warning: '警告',
  error: '异常',
  unknown: '未知',
}

export const processLabelMap: Record<ProcessState, string> = {
  running: '运行中',
  idle: '空闲',
  waiting: '等待中',
  unknown: '未知',
}

export function formatInterfaceName(networkInterface: NetworkInterfaceSnapshot) {
  return networkInterface.alias ? `${networkInterface.alias} (${networkInterface.name})` : networkInterface.name
}

export function formatInterfaceOption(networkInterface: NetworkInterfaceSnapshot) {
  return `${formatInterfaceName(networkInterface)} · ${formatInterfaceIps(networkInterface)}`
}

export function formatInterfaceIps(networkInterface: NetworkInterfaceSnapshot) {
  if (networkInterface.ips.length > 0) return networkInterface.ips.join(' / ')

  return networkInterface.operState === 'up' ? '无 IP' : 'DOWN'
}

export function formatInterfaceLinkSpeed(networkInterface: NetworkInterfaceSnapshot) {
  const speedMbps =
    networkInterface.linkSpeedMbps ??
    networkInterface.linkSpeedMbit ??
    networkInterface.speedMbps ??
    networkInterface.speedMbit ??
    networkInterface.speedMb
  const speedBitsPerSec = networkInterface.linkSpeedBitsPerSec ?? networkInterface.speedBitsPerSec

  if (typeof speedMbps === 'number' && Number.isFinite(speedMbps)) return `${formatLinkSpeedNumber(speedMbps)}MB`
  if (typeof speedBitsPerSec === 'number' && Number.isFinite(speedBitsPerSec)) {
    return `${formatLinkSpeedNumber(speedBitsPerSec / 1_000_000)}MB`
  }

  return networkInterface.operState === 'up' ? '速率未知' : 'DOWN'
}

export function formatChartTime(timestamp?: string) {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp.slice(5, 10)

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return '-'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const digits = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2
  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

export function formatSpeed(bytesPerSec: number) {
  return `${formatBytes(bytesPerSec)}/s`
}

export function formatPercent(value: number) {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%`
}

export function formatOptional(value: number | undefined, suffix: string) {
  if (value === undefined || !Number.isFinite(value)) return '-'

  const formatted = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
  return `${formatted}${suffix}`
}

export function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)

  if (days > 0) return `${days} 天 ${hours.toString().padStart(2, '0')} 小时`
  return `${hours} 小时`
}

export function formatCheckedAt(checkedAt: string) {
  const time = checkedAt.match(/T(\d{2}:\d{2}:\d{2})/)

  if (time?.[1]) return time[1]

  return '--:--:--'
}

export function mergeRealtimeNetworkSnapshot(
  currentSnapshot: NetworkInterfacesSnapshot | null,
  nextSnapshot: NetworkInterfacesSnapshot,
): NetworkInterfacesSnapshot {
  return {
    ...nextSnapshot,
    range: 'realtime',
    interfaces: nextSnapshot.interfaces.map((networkInterface) => {
      const previousInterface = currentSnapshot?.interfaces.find((item) => item.name === networkInterface.name)
      const previousPoints = previousInterface?.points ?? []
      const nextPoint: NetworkPoint = {
        timestamp: nextSnapshot.checkedAt,
        rxBytesPerSec: networkInterface.speed.rxBytesPerSec,
        txBytesPerSec: networkInterface.speed.txBytesPerSec,
      }

      return {
        ...networkInterface,
        points: [...previousPoints, nextPoint].slice(-20),
      }
    }),
  }
}

function formatLinkSpeedNumber(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}
