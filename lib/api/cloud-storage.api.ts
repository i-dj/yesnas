import { getStoragesUrl } from '@/lib/file-api'

export type CloudStorageProvider = 'google-drive' | 'onedrive' | 'dropbox'

export interface CloudStorageConnectPayload {
  name: string
  rootPath: string
}

export interface CloudStorageConnectResponse {
  provider: string
  authUrl: string
  state: string
  redirectUrl: string
  expiresAt: string
}

export interface CloudStorageOAuthStatusResponse {
  status: 'pending' | 'success' | 'error' | 'expired' | string
  message?: string
}

export interface CloudStorageCompleteResponse {
  connected: boolean
  provider: string
  storageId: string
  storage?: Record<string, unknown>
  rcloneRemoteName?: string
}

const parseErrorMessage = async (response: Response, fallback: string) => {
  const raw = await response.text()
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw) as { message?: string; error?: string; code?: string }
    return parsed.message || parsed.error || parsed.code || fallback
  } catch {
    return raw
  }
}

const getProviderStoragesUrl = (provider: CloudStorageProvider) => `${getStoragesUrl()}/${provider}`

export async function connectCloudStorage(
  provider: CloudStorageProvider,
  payload: CloudStorageConnectPayload,
): Promise<CloudStorageConnectResponse> {
  const response = await fetch(`${getProviderStoragesUrl(provider)}/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Cloud storage authorization failed: ${response.status}`))
  }

  return response.json()
}

export async function getCloudStorageOAuthStatus(
  provider: CloudStorageProvider,
  sessionId: string,
): Promise<CloudStorageOAuthStatusResponse> {
  const response = await fetch(
    `${getProviderStoragesUrl(provider)}/oauth-status/${encodeURIComponent(sessionId)}`,
    {
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Load cloud storage OAuth status failed: ${response.status}`))
  }

  return response.json()
}

export async function completeCloudStorage(
  provider: CloudStorageProvider,
  sessionId: string,
): Promise<CloudStorageCompleteResponse> {
  const response = await fetch(`${getProviderStoragesUrl(provider)}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Complete cloud storage connection failed: ${response.status}`))
  }

  return response.json()
}

export async function getConnectedStorages(): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(getStoragesUrl(), {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Load storages failed: ${response.status}`))
  }

  const payload = (await response.json()) as unknown
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>
  if (!payload || typeof payload !== 'object') return []

  const record = payload as Record<string, unknown>
  if (Array.isArray(record.items)) return record.items as Array<Record<string, unknown>>
  if (Array.isArray(record.data)) return record.data as Array<Record<string, unknown>>
  return []
}
