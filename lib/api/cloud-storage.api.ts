import type {
  CloudStorageCompleteResponse,
  CloudStorageConnectPayload,
  CloudStorageConnectResponse,
  CloudStorageOAuthStatusResponse,
  CloudStorageProvider,
  NetworkStorageCreatePayload,
  NetworkStorageCreateResponse,
  NetworkStorageProtocol,
  SMBShareListPayload,
  SMBShareListResponse,
} from '@/types'
import { request } from './request'

const providerPath = (provider: CloudStorageProvider) => `/storages/${provider}`

export const connectCloudStorage = (provider: CloudStorageProvider, payload: CloudStorageConnectPayload) =>
  request<CloudStorageConnectResponse>(`${providerPath(provider)}/connect`, {
    method: 'POST',
    body: payload,
  })

export const getCloudStorageOAuthStatus = (provider: CloudStorageProvider, sessionId: string) =>
  request<CloudStorageOAuthStatusResponse>(`${providerPath(provider)}/oauth-status/${encodeURIComponent(sessionId)}`)

export const completeCloudStorage = (provider: CloudStorageProvider, sessionId: string) =>
  request<CloudStorageCompleteResponse>(`${providerPath(provider)}/complete`, {
    method: 'POST',
    body: { sessionId },
  })

export const getConnectedStorages = () => request<Array<Record<string, unknown>>>('/storages', { unwrapList: true })

export const createNetworkStorage = (payload: NetworkStorageCreatePayload) =>
  request<NetworkStorageCreateResponse>('/storages/network', {
    method: 'POST',
    body: payload,
  })

export const listSMBShares = (payload: SMBShareListPayload) =>
  request<SMBShareListResponse>('/storages/network/smb/shares', {
    method: 'POST',
    body: payload,
  })

export type { CloudStorageProvider, NetworkStorageProtocol } from '@/types'
