import { request } from '@/lib/api/request'
import { createCrudApi } from './crud'
import { ProtocolItem, SharedFolder } from '@/types'

export const fileShareApi = {
  ...createCrudApi<SharedFolder>('/file-shares'),

  protocols: () => request<ProtocolItem[]>('/file-shares/protocols'),

  actionProtocol: (key: string, action: 'start' | 'stop') =>
    request(`/file-shares/protocols/${key}/action`, {
      method: 'POST',
      body: { action },
    }),
}
