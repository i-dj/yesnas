'use client'

import { Button, Input, RadioGroup, Select, StatusPill } from '@/components/ui'
import {
  completeCloudStorage,
  connectCloudStorage,
  createNetworkStorage,
  getCloudStorageOAuthStatus,
  getConnectedStorages,
  listSMBShares,
  type CloudStorageProvider,
  type NetworkStorageProtocol,
} from '@/lib/api/cloud-storage.api'
import { toast } from '@/store/use-toast-store'
import type { SMBShareItem } from '@/types'
import { Cloud, ExternalLink, FolderTree, Globe2, HardDrive, LoaderCircle, Network, Server } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface NetworkStorageCreatorProps {
  onCancel: () => void
  onConnected?: (storageId: string, storage?: Record<string, unknown>) => void
}

type ProviderKind = 'cloud' | 'protocol'
type ProviderValue = CloudStorageProvider | NetworkStorageProtocol

type ProviderCard = {
  kind: ProviderKind
  value: ProviderValue
  title: string
  defaultName: string
  description: string
  icon: LucideIcon
  defaultPort?: number
  hostLabel?: string
  shareLabel?: string
  messageProviders?: string[]
  requiresUrl?: boolean
  requiresShare?: boolean
  supportsCredentials?: boolean
  supportsDomain?: boolean
  shareHelp?: string
}

type OAuthMessagePayload = {
  type?: string
  provider?: string
  success?: boolean
  message?: string
}

const cloudProviders: ProviderCard[] = [
  {
    kind: 'cloud',
    value: 'google-drive',
    title: 'Google Drive',
    defaultName: '我的 Google 网盘',
    description: '通过 Google 授权窗口接入云盘，完成后自动创建并挂载。',
    icon: HardDrive,
    messageProviders: ['google', 'google-drive', 'google_drive'],
  },
  {
    kind: 'cloud',
    value: 'onedrive',
    title: 'OneDrive',
    defaultName: '我的 OneDrive',
    description: '通过 Microsoft 授权窗口接入 OneDrive，完成后自动创建并挂载。',
    icon: HardDrive,
    messageProviders: ['onedrive', 'one_drive', 'microsoft'],
  },
  {
    kind: 'cloud',
    value: 'dropbox',
    title: 'Dropbox',
    defaultName: '我的 Dropbox',
    description: '通过 Dropbox 授权窗口接入云盘，完成后自动创建并挂载。',
    icon: HardDrive,
    messageProviders: ['dropbox'],
  },
]

const protocolProviders: ProviderCard[] = [
  {
    kind: 'protocol',
    value: 'smb',
    title: 'SMB',
    defaultName: '我的 SMB 共享',
    description: '挂载 Windows、Samba 或 NAS 共享目录。',
    icon: Network,
    hostLabel: '服务器地址',
    shareLabel: '共享名称',
    shareHelp: 'SMB 必须填写共享名，例如 public 或 1683；不是服务器根路径。',
    requiresShare: true,
    supportsCredentials: true,
    supportsDomain: true,
  },
  {
    kind: 'protocol',
    value: 'nfs',
    title: 'NFS',
    defaultName: '我的 NFS 共享',
    description: '挂载 Linux / Unix NFS 导出目录。',
    icon: FolderTree,
    hostLabel: '服务器地址',
    shareLabel: '导出路径',
    shareHelp: '填写 NFS 服务端导出的路径，例如 /volume1/data。',
    requiresShare: true,
  },
  {
    kind: 'protocol',
    value: 'webdav',
    title: 'WebDAV',
    defaultName: '我的 WebDAV',
    description: '通过 WebDAV URL 挂载远程文件服务。',
    icon: Globe2,
    requiresUrl: true,
    supportsCredentials: true,
  },
  {
    kind: 'protocol',
    value: 'ftp',
    title: 'FTP',
    defaultName: '我的 FTP',
    description: '通过 FTP 主机地址挂载远程目录。',
    icon: Server,
    defaultPort: 21,
    hostLabel: '服务器地址',
    supportsCredentials: true,
  },
]

const allProviders = [...cloudProviders, ...protocolProviders]
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
  const [provider, setProvider] = useState<ProviderValue>('google-drive')
  const [name, setName] = useState('我的 Google 网盘')
  const [rootPath, setRootPath] = useState('root')
  const [host, setHost] = useState('')
  const [port, setPort] = useState('')
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [domain, setDomain] = useState('')
  const [shareName, setShareName] = useState('')
  const [smbShares, setSMBShares] = useState<SMBShareItem[]>([])
  const [sharesLoading, setSharesLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [statusText, setStatusText] = useState('')
  const abortRef = useRef(false)

  const selectedProvider = useMemo(
    () => allProviders.find((item) => item.value === provider) ?? cloudProviders[0],
    [provider],
  )
  const isCloud = selectedProvider.kind === 'cloud'

  useEffect(() => {
    return () => {
      abortRef.current = true
    }
  }, [])

  useEffect(() => {
    if (provider === 'smb') setSMBShares([])
  }, [domain, host, password, provider, username])

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
          const result = await getCloudStorageOAuthStatus(currentProvider.value as CloudStorageProvider, sessionId)
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
        if (!data?.provider || !currentProvider.messageProviders?.includes(data.provider)) return

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
    setRootPath(nextProvider.kind === 'cloud' ? 'root' : '/')
    setPort(nextProvider.defaultPort ? String(nextProvider.defaultPort) : '')
    setHost('')
    setUrl('')
    setUsername('')
    setPassword('')
    setDomain('')
    setShareName('')
    setSMBShares([])
  }

  const handleLoadSMBShares = async () => {
    const trimmedHost = host.trim()
    if (!trimmedHost) {
      toast.error('请输入 SMB 服务器地址')
      return
    }

    setSharesLoading(true)
    try {
      const result = await listSMBShares({
        host: trimmedHost,
        username: username.trim() || undefined,
        password: password || undefined,
        domain: domain.trim() || undefined,
      })
      const shares = result.items ?? []
      setSMBShares(shares)
      if (shares.length && !shares.some((item) => item.name === shareName)) {
        setShareName(shares[0].name)
      }
      toast.success(shares.length ? `发现 ${shares.length} 个 SMB 共享` : '没有发现可挂载的 SMB 共享')
    } catch (error) {
      setSMBShares([])
      toast.error(error instanceof Error ? error.message : '读取 SMB 共享列表失败', 6000)
    } finally {
      setSharesLoading(false)
    }
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
      const currentValue = currentProvider.value as CloudStorageProvider
      const session = await connectCloudStorage(currentValue, {
        name: trimmedName,
        rootPath: trimmedRootPath,
      })
      const sessionId = session.state

      if (!session.authUrl || !sessionId) {
        throw new Error(`后端未返回完整的 ${currentProvider.title} 授权会话。`)
      }

      setStatusText(`正在打开 ${currentProvider.title} 授权窗口…`)
      const popup = window.open(session.authUrl, `oauth-${currentValue}`, 'width=520,height=720')
      if (!popup) {
        throw new Error('浏览器阻止了授权弹窗，请允许弹窗后重试。')
      }

      popup.focus()
      setStatusText(`请在弹出的 ${currentProvider.title} 窗口中登录并授权。`)

      await waitForOAuth(sessionId, popup, currentProvider)
      closeOAuthPopup(popup)

      setStatusText('授权成功，正在创建并挂载云盘…')
      const completed = await completeCloudStorage(currentValue, sessionId)
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

  const handleCreateProtocolStorage = async () => {
    const trimmedName = name.trim()
    const trimmedHost = host.trim()
    const trimmedUrl = url.trim()
    const trimmedShareName = shareName.trim()
    const trimmedRootPath = rootPath.trim()

    if (!trimmedName) {
      toast.error('请输入存储名称')
      return
    }
    if (selectedProvider.requiresUrl && !trimmedUrl) {
      toast.error('请输入 WebDAV 地址')
      return
    }
    if (!selectedProvider.requiresUrl && !trimmedHost) {
      toast.error('请输入服务器地址')
      return
    }
    if (selectedProvider.requiresShare && !trimmedShareName) {
      toast.error(`请输入${selectedProvider.shareLabel ?? '共享路径'}`)
      return
    }
    const nextPort = port.trim() ? Number(port) : undefined
    if (nextPort !== undefined && (!Number.isInteger(nextPort) || nextPort <= 0 || nextPort > 65535)) {
      toast.error('请输入有效端口')
      return
    }

    setConnecting(true)
    setStatusText(`正在挂载 ${selectedProvider.title} 存储…`)

    try {
      const result = await createNetworkStorage({
        name: trimmedName,
        protocol: selectedProvider.value as NetworkStorageProtocol,
        host: trimmedHost || undefined,
        port: nextPort,
        url: trimmedUrl || undefined,
        username: username.trim() || undefined,
        password: password || undefined,
        domain: domain.trim() || undefined,
        shareName: trimmedShareName || undefined,
        rootPath: trimmedRootPath || undefined,
      })

      toast.success(`${selectedProvider.title} 已添加并挂载成功`)
      onConnected?.(result.storageId, result.storage)
      onCancel()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${selectedProvider.title} 挂载失败`, 6000)
    } finally {
      setConnecting(false)
      setStatusText('')
    }
  }

  const providerOptions = (items: ProviderCard[]) =>
    items.map((item) => {
      const Icon = item.icon
      return {
        value: item.value,
        label: (
          <span className="flex items-start gap-3">
            <span className="border-app-border bg-app-hover/50 text-app-text flex size-10 shrink-0 items-center justify-center rounded-lg border">
              <Icon className="size-4" />
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
      }
    })

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-6 p-5">
        <div className="border-app-border bg-app-hover/25 flex items-start gap-3 rounded-lg border p-4">
          <div className="bg-app-hover text-app-text flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Cloud className="size-5" />
          </div>
          <div>
            <h3 className="text-app-text text-sm font-semibold">添加网络存储</h3>
            <p className="text-app-text-muted mt-1 text-xs leading-5">
              选择云盘服务或网络协议。创建完成后，NAS 会自动创建存储并挂载。
            </p>
          </div>
        </div>

        <ProviderSection title="选择云盘" description="适合 Google Drive、OneDrive、Dropbox 这类需要授权的云盘。">
          <RadioGroup<ProviderValue>
            value={provider}
            variant="card"
            disabled={connecting}
            className="grid-cols-1"
            onValueChange={(value) => {
              const nextProvider = allProviders.find((item) => item.value === value)
              if (nextProvider) handleSelectProvider(nextProvider)
            }}
            ariaLabel="选择云盘"
            options={providerOptions(cloudProviders)}
          />
        </ProviderSection>

        <ProviderSection title="网络协议" description="适合局域网共享、远程 WebDAV、FTP 或 Linux NFS 导出目录。">
          <RadioGroup<ProviderValue>
            value={provider}
            variant="card"
            disabled={connecting}
            className="grid-cols-1 md:grid-cols-2"
            onValueChange={(value) => {
              const nextProvider = allProviders.find((item) => item.value === value)
              if (nextProvider) handleSelectProvider(nextProvider)
            }}
            ariaLabel="选择网络协议"
            options={providerOptions(protocolProviders)}
          />
        </ProviderSection>

        <div className="space-y-4">
          <TextField
            id="network-storage-name"
            label="存储名称"
            value={name}
            onChange={setName}
            placeholder={selectedProvider.defaultName}
            disabled={connecting}
          />

          {isCloud ? (
            <TextField
              id="network-storage-root-path"
              label="根目录"
              value={rootPath}
              onChange={setRootPath}
              placeholder="root"
              disabled={connecting}
              help="使用 root 挂载整个云盘。"
            />
          ) : (
            <ProtocolFields
              provider={selectedProvider}
              host={host}
              setHost={setHost}
              port={port}
              setPort={setPort}
              url={url}
              setUrl={setUrl}
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              domain={domain}
              setDomain={setDomain}
              shareName={shareName}
              setShareName={setShareName}
              smbShares={smbShares}
              onLoadSMBShares={handleLoadSMBShares}
              sharesLoading={sharesLoading}
              rootPath={rootPath}
              setRootPath={setRootPath}
              disabled={connecting}
            />
          )}
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
          icon={connecting ? LoaderCircle : isCloud ? ExternalLink : Network}
          onClick={() => void (isCloud ? handleConnectCloudStorage() : handleCreateProtocolStorage())}
          disabled={connecting}
          className={connecting ? '[&_svg]:animate-spin' : undefined}
        >
          {connecting ? '正在处理…' : `${isCloud ? '连接' : '挂载'} ${selectedProvider.title}`}
        </Button>
      </div>
    </div>
  )
}

function ProviderSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div>
        <h4 className="text-app-text text-xs font-semibold">{title}</h4>
        <p className="text-app-text-muted mt-1 text-xs">{description}</p>
      </div>
      {children}
    </section>
  )
}

function ProtocolFields({
  provider,
  host,
  setHost,
  port,
  setPort,
  url,
  setUrl,
  username,
  setUsername,
  password,
  setPassword,
  domain,
  setDomain,
  shareName,
  setShareName,
  smbShares,
  onLoadSMBShares,
  sharesLoading,
  rootPath,
  setRootPath,
  disabled,
}: {
  provider: ProviderCard
  host: string
  setHost: (value: string) => void
  port: string
  setPort: (value: string) => void
  url: string
  setUrl: (value: string) => void
  username: string
  setUsername: (value: string) => void
  password: string
  setPassword: (value: string) => void
  domain: string
  setDomain: (value: string) => void
  shareName: string
  setShareName: (value: string) => void
  smbShares: SMBShareItem[]
  onLoadSMBShares: () => void
  sharesLoading: boolean
  rootPath: string
  setRootPath: (value: string) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-4">
      {provider.requiresUrl ? (
        <TextField
          id="network-storage-url"
          label="服务地址"
          value={url}
          onChange={setUrl}
          placeholder="https://example.com/dav"
          disabled={disabled}
        />
      ) : (
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <TextField
            id="network-storage-host"
            label={provider.hostLabel ?? '服务器地址'}
            value={host}
            onChange={setHost}
            placeholder="192.168.1.10"
            disabled={disabled}
          />
          <TextField
            id="network-storage-port"
            label="端口"
            value={port}
            onChange={setPort}
            placeholder={provider.defaultPort ? String(provider.defaultPort) : '默认'}
            disabled={disabled}
          />
        </div>
      )}

      {provider.requiresShare ? (
        provider.value === 'smb' ? (
          <SMBShareField
            value={shareName}
            onChange={setShareName}
            shares={smbShares}
            loading={sharesLoading}
            disabled={disabled}
            onLoadShares={onLoadSMBShares}
            help={provider.shareHelp}
          />
        ) : (
          <TextField
            id="network-storage-share"
            label={provider.shareLabel ?? '共享路径'}
            value={shareName}
            onChange={setShareName}
            placeholder="/volume1/data"
            disabled={disabled}
            help={provider.shareHelp}
          />
        )
      ) : null}

      {provider.supportsCredentials ? (
        <div className="grid grid-cols-2 gap-3">
          <TextField
            id="network-storage-username"
            label="用户名"
            value={username}
            onChange={setUsername}
            placeholder="可选"
            disabled={disabled}
          />
          <TextField
            id="network-storage-password"
            label="密码"
            value={password}
            onChange={setPassword}
            placeholder="可选"
            disabled={disabled}
            type="password"
          />
        </div>
      ) : null}

      {provider.supportsDomain ? (
        <TextField
          id="network-storage-domain"
          label="域"
          value={domain}
          onChange={setDomain}
          placeholder="可选"
          disabled={disabled}
        />
      ) : null}

      <TextField
        id="network-storage-root-path"
        label="根目录"
        value={rootPath}
        onChange={setRootPath}
        placeholder="/"
        disabled={disabled}
        help={
          provider.value === 'smb'
            ? '默认挂载共享根目录；这里只填写共享内的子目录，例如 media。'
            : '默认挂载远端根目录，按需填写子目录。'
        }
      />
    </div>
  )
}

function SMBShareField({
  value,
  onChange,
  shares,
  loading,
  disabled,
  onLoadShares,
  help,
}: {
  value: string
  onChange: (value: string) => void
  shares: SMBShareItem[]
  loading: boolean
  disabled: boolean
  onLoadShares: () => void
  help?: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-app-text text-xs font-medium" htmlFor="network-storage-share">
        共享名称
      </label>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        {shares.length ? (
          <Select
            id="network-storage-share"
            value={value}
            onValueChange={onChange}
            disabled={disabled || loading}
            aria-label="选择 SMB 共享"
          >
            {shares.map((share) => (
              <option key={share.name} value={share.name}>
                {share.comment ? `${share.name} · ${share.comment}` : share.name}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            id="network-storage-share"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="先浏览共享，或手动输入共享名"
            disabled={disabled || loading}
          />
        )}
        <Button
          type="button"
          variant="borderghost"
          size="sm"
          loading={loading}
          disabled={disabled}
          onClick={() => void onLoadShares()}
          className="h-9 px-3"
        >
          浏览共享
        </Button>
      </div>
      {shares.length ? (
        <p className="text-app-text-muted text-xs">已读取到 {shares.length} 个共享，可从下拉列表选择。</p>
      ) : help ? (
        <p className="text-app-text-muted text-xs">{help}</p>
      ) : null}
    </div>
  )
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  help,
  type = 'text',
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  help?: string
  type?: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-app-text text-xs font-medium" htmlFor={id}>
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {help ? <p className="text-app-text-muted text-xs">{help}</p> : null}
    </div>
  )
}
