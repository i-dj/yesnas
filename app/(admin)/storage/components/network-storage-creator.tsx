'use client'

import { Button, Input, RadioGroup, StatusPill } from '@/components/ui'
import {
  completeCloudStorage,
  connectCloudStorage,
  getCloudStorageOAuthStatus,
  getConnectedStorages,
  type CloudStorageProvider,
} from '@/lib/api/cloud-storage.api'
import { toast } from '@/store/use-toast-store'
import { Cloud, ExternalLink, HardDrive, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface NetworkStorageCreatorProps {
  onCancel: () => void
  onConnected?: (storageId: string, storage?: Record<string, unknown>) => void
}

type ProviderCard = {
  value: CloudStorageProvider
  title: string
  defaultName: string
  description: string
  messageProviders: string[]
}

type OAuthMessagePayload = {
  type?: string
  provider?: string
  success?: boolean
  message?: string
}

const cloudProviders: ProviderCard[] = [
  {
    value: 'google-drive',
    title: 'Google Drive',
    defaultName: '我的 Google 网盘',
    description: '通过 Google 授权窗口接入云盘，完成后自动创建并挂载。',
    messageProviders: ['google', 'google-drive', 'google_drive'],
  },
  {
    value: 'onedrive',
    title: 'OneDrive',
    defaultName: '我的 OneDrive',
    description: '通过 Microsoft 授权窗口接入 OneDrive，完成后自动创建并挂载。',
    messageProviders: ['onedrive', 'one_drive', 'microsoft'],
  },
  {
    value: 'dropbox',
    title: 'Dropbox',
    defaultName: '我的 Dropbox',
    description: '通过 Dropbox 授权窗口接入云盘，完成后自动创建并挂载。',
    messageProviders: ['dropbox'],
  },
]

const OAUTH_POLL_INTERVAL_MS = 1500
const OAUTH_TIMEOUT_MS = 5 * 60 * 1000

const closeOAuthPopup = (popup: Window | null) => {
  try {
    if (popup && !popup.closed) popup.close()
  } catch {
    // Some browsers can throw while closing a cross-origin popup. The broker also attempts to close itself.
  }
}

export function NetworkStorageCreator({ onCancel, onConnected }: NetworkStorageCreatorProps) {
  const [provider, setProvider] = useState<CloudStorageProvider>('google-drive')
  const [name, setName] = useState('我的 Google 网盘')
  const [rootPath, setRootPath] = useState('root')
  const [connecting, setConnecting] = useState(false)
  const [statusText, setStatusText] = useState('')
  const abortRef = useRef(false)

  const selectedProvider = useMemo(
    () => cloudProviders.find((item) => item.value === provider) ?? cloudProviders[0],
    [provider],
  )

  useEffect(() => {
    return () => {
      abortRef.current = true
    }
  }, [])

  const waitForOAuth = (sessionId: string, popup: Window | null, currentProvider: ProviderCard) =>
    new Promise<void>((resolve, reject) => {
      const startedAt = Date.now()
      let completed = false
      let checking = false
      let timer = 0

      const cleanup = () => {
        completed = true
        window.removeEventListener('message', handleMessage)
        window.clearInterval(timer)
      }

      const finish = (callback: () => void) => {
        if (completed) return
        cleanup()
        callback()
      }

      const checkStatus = async () => {
        if (completed || checking || abortRef.current) return

        if (Date.now() - startedAt > OAUTH_TIMEOUT_MS) {
          closeOAuthPopup(popup)
          finish(() => reject(new Error(`${currentProvider.title} 授权等待超时，请重新发起授权。`)))
          return
        }

        checking = true
        try {
          const result = await getCloudStorageOAuthStatus(currentProvider.value, sessionId)
          if (result.status === 'success') {
            closeOAuthPopup(popup)
            finish(resolve)
            return
          }

          if (result.status === 'error' || result.status === 'expired') {
            closeOAuthPopup(popup)
            finish(() => reject(new Error(result.message || `${currentProvider.title} 授权失败，请重新授权。`)))
            return
          }

          if (popup?.closed) {
            setStatusText('授权窗口已关闭，正在确认授权结果…')
          }
        } catch (error) {
          finish(() => reject(error))
        } finally {
          checking = false
        }
      }

      const handleMessage = (event: MessageEvent<OAuthMessagePayload>) => {
        const data = event.data
        if (!data?.provider || !currentProvider.messageProviders.includes(data.provider)) return

        if (data.type === 'oauth_error') {
          closeOAuthPopup(popup)
          finish(() => reject(new Error(data.message || `${currentProvider.title} 授权失败，请重新授权。`)))
          return
        }

        if (data.type === 'oauth_success') {
          closeOAuthPopup(popup)
          setStatusText('授权窗口已完成，正在向 NAS 确认状态…')
          void checkStatus()
        }
      }

      window.addEventListener('message', handleMessage)
      timer = window.setInterval(checkStatus, OAUTH_POLL_INTERVAL_MS)
      void checkStatus()
    })

  const handleSelectProvider = (nextProvider: ProviderCard) => {
    setProvider(nextProvider.value)
    setName(nextProvider.defaultName)
  }

  const handleConnectCloudStorage = async () => {
    const trimmedName = name.trim()
    const trimmedRootPath = rootPath.trim()

    if (!trimmedName) {
      toast.error('请输入存储名称')
      return
    }

    if (!trimmedRootPath) {
      toast.error('请输入云盘根目录')
      return
    }

    abortRef.current = false
    setConnecting(true)
    setStatusText('正在创建授权会话…')

    try {
      const currentProvider = selectedProvider
      const session = await connectCloudStorage(currentProvider.value, {
        name: trimmedName,
        rootPath: trimmedRootPath,
      })
      const sessionId = session.state

      if (!session.authUrl || !sessionId) {
        throw new Error(`后端未返回完整的 ${currentProvider.title} 授权会话。`)
      }

      setStatusText(`正在打开 ${currentProvider.title} 授权窗口…`)
      const popup = window.open(session.authUrl, `oauth-${currentProvider.value}`, 'width=520,height=720')
      if (!popup) {
        throw new Error('浏览器阻止了授权弹窗，请允许弹窗后重试。')
      }

      popup.focus()
      setStatusText(`请在弹出的 ${currentProvider.title} 窗口中登录并授权。`)

      await waitForOAuth(sessionId, popup, currentProvider)
      closeOAuthPopup(popup)

      setStatusText('授权成功，正在创建并挂载云盘…')
      const completed = await completeCloudStorage(currentProvider.value, sessionId)
      if (!completed.connected || !completed.storageId) {
        throw new Error(`${currentProvider.title} 授权已完成，但挂载结果异常。`)
      }

      const storages = await getConnectedStorages().catch(() => [])
      const storage = storages.find((item) => String(item.id) === completed.storageId) ?? completed.storage

      toast.success(`${currentProvider.title} 已添加并挂载成功`)
      onConnected?.(completed.storageId, storage)
      onCancel()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '无法完成云盘授权', 6000)
    } finally {
      setConnecting(false)
      setStatusText('')
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-6 p-5">
        <div className="border-app-border bg-app-hover/25 flex items-start gap-3 rounded-xl border p-4">
          <div className="bg-app-hover text-app-text flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Cloud className="size-5" />
          </div>
          <div>
            <h3 className="text-app-text text-sm font-semibold">添加网络存储</h3>
            <p className="text-app-text-muted mt-1 text-xs leading-5">
              选择要接入的云盘服务。授权完成后，NAS 会调用 complete 接口创建存储并挂载。
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-app-text text-xs font-semibold">选择云盘</h4>
            <p className="text-app-text-muted mt-1 text-xs">支持 Google Drive、OneDrive 和 Dropbox。</p>
          </div>

          <RadioGroup
            value={provider}
            variant="card"
            disabled={connecting}
            onValueChange={(value) => {
              const nextProvider = cloudProviders.find((item) => item.value === value)
              if (nextProvider) handleSelectProvider(nextProvider)
            }}
            ariaLabel="选择云盘"
            options={cloudProviders.map((item) => ({
              value: item.value,
              label: (
                <span className="flex items-start gap-3">
                  <span className="border-app-border bg-app-hover/50 text-app-text flex size-10 shrink-0 items-center justify-center rounded-lg border">
                    <HardDrive className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-app-text text-sm font-semibold">{item.title}</span>
                      <StatusPill color="success" content="已支持" />
                    </span>
                    <span className="text-app-text-muted mt-1 block text-xs leading-5">{item.description}</span>
                  </span>
                </span>
              ),
            }))}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-app-text text-xs font-medium" htmlFor="cloud-storage-name">
              存储名称
            </label>
            <Input
              id="cloud-storage-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={selectedProvider.defaultName}
              disabled={connecting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-app-text text-xs font-medium" htmlFor="cloud-storage-root-path">
              根目录
            </label>
            <Input
              id="cloud-storage-root-path"
              value={rootPath}
              onChange={(event) => setRootPath(event.target.value)}
              placeholder="root"
              disabled={connecting}
            />
            <p className="text-app-text-muted text-xs">使用 root 挂载整个云盘。</p>
          </div>
        </div>

        {statusText ? (
          <div className="border-app-border bg-app-hover/25 text-app-text-muted flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
            <LoaderCircle className="size-4 animate-spin" />
            <span>{statusText}</span>
          </div>
        ) : null}
      </div>

      <div className="border-app-border flex items-center justify-end gap-2 border-t p-4">
        <Button type="button" variant="borderghost" onClick={onCancel} disabled={connecting}>
          取消
        </Button>
        <Button
          type="button"
          icon={connecting ? LoaderCircle : ExternalLink}
          onClick={() => void handleConnectCloudStorage()}
          disabled={connecting}
          className={connecting ? '[&_svg]:animate-spin' : undefined}
        >
          {connecting ? '正在授权…' : `连接 ${selectedProvider.title}`}
        </Button>
      </div>
    </div>
  )
}
