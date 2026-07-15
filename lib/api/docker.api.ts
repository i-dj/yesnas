import { BASE } from './base'

export const dockerApi = {
  containersStreamUrl: (interval = 1) => `${BASE}/docker/containers/stream?interval=${interval}`,
}
