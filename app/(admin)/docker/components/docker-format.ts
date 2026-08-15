import { bytesFormat } from '@/lib/utils'
import type { DockerContainer } from '@/types'

export const formatCpuPercent = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0'
  if (value < 0.1) return '<0.1'
  return value.toFixed(value >= 10 ? 0 : 1)
}

export const formatNetworkBytes = (value: number) =>
  bytesFormat(value, { standard: 's', decimalPlaces: value >= 1024 ? 1 : 0 })

export const splitMetricValue = (formatted: string) => {
  const [value, ...unit] = formatted.split(' ')
  return { value, unit: unit.join(' ') }
}

export const getContainerStatus = (
  container: DockerContainer,
): { label: string; color: 'success' | 'warning' | 'danger' } => {
  const state = container.state || container.status
  if (container.running) return { label: 'running', color: 'success' }
  if (state === 'paused') return { label: 'paused', color: 'warning' }
  return { label: state || 'stopped', color: 'danger' }
}

const webPorts = new Set([
  80, 443, 3000, 3001, 3552, 5000, 5173, 7000, 7070, 8000, 8001, 8080, 8081, 8096, 8123, 8443, 8888, 9000, 9001, 9090,
  9443, 10000,
])

const httpsPorts = new Set([443, 8443, 9443])

const getUniquePorts = (ports: DockerContainer['ports']) => {
  const seen = new Set<string>()
  return ports.filter((port) => {
    const key = `${port.hostPort || ''}:${port.containerPort}/${port.protocol}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const getWebEntry = (ports: DockerContainer['ports']) => {
  const port = getUniquePorts(ports).find(
    (item) =>
      item.protocol === 'tcp' && item.hostPort && (webPorts.has(item.hostPort) || webPorts.has(item.containerPort)),
  )
  if (!port?.hostPort) return null
  return {
    hostPort: port.hostPort,
    containerPort: port.containerPort,
    scheme: httpsPorts.has(port.hostPort) || httpsPorts.has(port.containerPort) ? 'https' : 'http',
  }
}
