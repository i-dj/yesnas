import type {
  CloudStorageCompleteResponse,
  CloudStorageConnectPayload,
  CloudStorageConnectResponse,
  CloudStorageOAuthStatusResponse,
  CloudStorageProvider,
} from '@/types'
import { request } from './request'

const providerPath = (provider: CloudStorageProvider) => `/storages/${provider}`

export const connectCloudStorage = (provider: CloudStorageProvider, payload: CloudStorageConnectPayload) =>
  request<CloudStorageConnectResponse>(`${providerPath(provider)}/connect`, {
    method: 'POST',
    body: payload,
  })

export const getCloudStorageOAuthStatus = (provider: CloudStorageProvider, sessionId: string) =>
  request<CloudStorageOAuthStatusResponse>(
    `${providerPath(provider)}/oauth-status/${encodeURIComponent(sessionId)}`,
  )

export const completeCloudStorage = (provider: CloudStorageProvider, sessionId: string) =>
  request<CloudStorageCompleteResponse>(`${providerPath(provider)}/complete`, {
    method: 'POST',
    body: { sessionId },
  })

export const getConnectedStorages = () =>
  request<Array<Record<string, unknown>>>('/storages', { unwrapList: true })

export type { CloudStorageProvider } from '@/types'
