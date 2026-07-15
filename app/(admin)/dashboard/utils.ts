import {
  NetworkInterfaceSnapshot,
  SystemState,
} from '@/types/models/dashboard'
import { formatBytesPerSecond } from '@/lib/utils'

export const statusLabelMap: Record<SystemState, string> = {
  healthy: '运行正常',
  warning: '需要关注',
  error: '异常',
  unknown: '未知',
}

export function formatInterfaceName(networkInterface: NetworkInterfaceSnapshot) {
  return networkInterface.alias ? `${networkInterface.alias} (${networkInterface.name})` : networkInterface.name
}

export function formatInterfaceOption(networkInterface: NetworkInterfaceSnapshot) {
  return `${formatInterfaceName(networkInterface)} · ${formatInterfaceIps(networkInterface)}`
}

function formatInterfaceIps(networkInterface: NetworkInterfaceSnapshot) {
  if (networkInterface.ips.length > 0) return networkInterface.ips.join(' / ')

  return networkInterface.operState === 'up' ? '无 IP' : 'DOWN'
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
    second: '2-digit',
    hour12: false,
  })
}

export const formatSpeed = formatBytesPerSecond

export function formatCheckedAt(checkedAt: string) {
  const time = checkedAt.match(/T(\d{2}:\d{2}:\d{2})/)

  if (time?.[1]) return time[1]

  return '--:--:--'
}

function formatLinkSpeedNumber(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}
