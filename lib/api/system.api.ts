import type { NetworkInterfacesSnapshot } from '@/types'
import { BASE } from './base'
import { request } from './request'

export const systemApi = {
  network: (range = '1h') => request<NetworkInterfacesSnapshot>(`/system/network?range=${encodeURIComponent(range)}`),
  statusStreamUrl: (interval = 2) => `${BASE}/system/status/stream?interval=${interval}`,
  hardwareStreamUrl: (interval = 3) => `${BASE}/system/hardware/stream?interval=${interval}`,
  networkStreamUrl: (interval = 1) => `${BASE}/system/network/stream?interval=${interval}`,
}
