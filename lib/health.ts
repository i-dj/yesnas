export type NormalizedHealthState = 'healthy' | 'warning' | 'error' | 'unknown'

const HEALTHY_VALUES = new Set(['healthy', 'passed'])
const WARNING_VALUES = new Set(['warning', 'degraded'])
const ERROR_VALUES = new Set(['error', 'failed', 'fail', 'critical'])

export const healthLabelMap: Record<NormalizedHealthState, string> = {
  healthy: '健康',
  warning: '警告',
  error: '异常',
  unknown: '未知',
}

export function normalizeHealthState(value: unknown): NormalizedHealthState {
  const normalized = String(value ?? '').trim().toLowerCase()

  if (HEALTHY_VALUES.has(normalized)) return 'healthy'
  if (WARNING_VALUES.has(normalized)) return 'warning'
  if (ERROR_VALUES.has(normalized)) return 'error'
  return 'unknown'
}

export function resolveHealthState(...values: unknown[]): NormalizedHealthState {
  const states = values.map(normalizeHealthState)

  if (states.includes('healthy')) return 'healthy'
  if (states.includes('warning')) return 'warning'
  if (states.includes('error')) return 'error'
  return 'unknown'
}

export function isHealthyHealth(value: unknown): boolean {
  return normalizeHealthState(value) === 'healthy'
}

export function isRiskHealth(value: unknown): boolean {
  const state = normalizeHealthState(value)
  return state === 'warning' || state === 'error'
}
