'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import {
  Button,
  Checkbox,
  DataTable,
  EmptyState,
  Input,
  SectionTitle,
  Select,
  SideDrawer,
  StorageLocationPicker,
  Tooltip,
  type StorageLocationValue,
} from '@/components/ui'
import {
  getFileShareProtocolActionUrl,
  getFileShareProtocolsUrl,
  getFileShareUrl,
  getFileSharesUrl,
  getStoragePoolsUrl,
  getUsersUrl,
} from '@/lib/file-api'
import { cn } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import type { User } from '@/types'
import type { StoragePoolModel } from '@/types/models/storage'
import { Copy, Globe2, HardDriveDownload, Network, Plus, UploadCloud } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { getFileSharingColumns } from './_columns/file-sharing-columns'
import type { FileShareProtocolItem, ProtocolItem, ProtocolKey, ShareStatus, SharedFolder } from './_types'
import { UserPicker } from './_components/user-picker'

const initialProtocols: ProtocolItem[] = [
  {
    protocol: 'smb',
    key: 'smb',
    icon: HardDriveDownload,
    shareUrl: 'smb://yesnas:445',
    port: 445,
    active: false,
    serviceName: 'smbd',
    status: 'unknown',
    shareCount: 0,
  },
  {
    protocol: 'ftp',
    key: 'ftp',
    icon: UploadCloud,
    shareUrl: 'ftp://yesnas:21',
    port: 21,
    active: false,
    serviceName: 'proftpd',
    status: 'unknown',
    shareCount: 0,
  },
  {
    protocol: 'webdav',
    key: 'webdav',
    icon: Globe2,
    shareUrl: 'http://yesnas:8088',
    port: 8088,
    active: false,
    serviceName: 'apache2',
    status: 'unknown',
    shareCount: 0,
  },
  {
    protocol: 'nfs',
    key: 'nfs',
    icon: Network,
    shareUrl: 'yesnas:/',
    port: 2049,
    active: false,
    serviceName: 'nfs-server',
    status: 'unknown',
    shareCount: 0,
  },
]

const emptyForm = {
  name: '',
  storagePoolId: '',
  path: '',
  protocols: ['smb'] as ProtocolKey[],
  userIds: [] as string[],
  clientNetworks: [] as string[],
  status: 'enabled' as ShareStatus,
}

const getPoolRootPath = (pool?: StoragePoolModel) => pool?.dataPath || pool?.mountPath || ''

const joinPath = (root: string, names: string[]) => {
  const cleanRoot = root.replace(/\/+$/, '')
  return names.length > 0 ? `${cleanRoot}/${names.join('/')}` : cleanRoot
}

const getPathNames = (pool: StoragePoolModel | undefined, path: string) => {
  const root = getPoolRootPath(pool)
  if (!root || !path.startsWith(root)) return []
  return path.slice(root.length).replace(/^\/+/, '').split('/').filter(Boolean)
}

const parseApiErrorMessage = (raw: string, fallback: string) => {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as { message?: string; error?: string; code?: string }
    return parsed.message || parsed.error || parsed.code || raw
  } catch {
    return raw
  }
}

const formatProtocolEndpoint = (href: string, port: number) => {
  if (/^[a-z]+:\/\/[^/]+:\d+/i.test(href) || /^[^/]+:\//.test(href)) return href

  const protocol = href.match(/^([a-z]+):\/\//i)?.[1]?.toLowerCase()
  const withoutProtocol = href.replace(/^[a-z]+:\/\//i, '')
  const withoutPath = withoutProtocol.split('/')[0] || withoutProtocol
  const withoutExistingPort = withoutPath.replace(/:\d+$/, '')

  return `${protocol ? `${protocol}://` : ''}${withoutExistingPort}:${port}`
}

const parseClientNetworks = (value: string) =>
  value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean)

const normalizeShare = (share: SharedFolder): SharedFolder => ({
  ...share,
  status: share.status ?? (share.enabled ? 'enabled' : 'disabled'),
  userIds: share.userIds ?? share.users?.map((user) => user.id) ?? [],
  clientNetworks: share.clientNetworks ?? [],
})

const mergeProtocolItems = (current: ProtocolItem[], items: FileShareProtocolItem[]) =>
  current.map((protocol) => {
    const item = items.find((candidate) => candidate.protocol === protocol.key)

    return item
      ? {
          ...protocol,
          serviceName: item.serviceName,
          active: item.active,
          status: item.status,
          shareUrl: item.shareUrl,
          port: item.port,
          shareCount: item.shareCount,
        }
      : protocol
  })

export function FileSharingClient({
  initialData,
}: {
  initialData: {
    storagePools: StoragePoolModel[]
    users: User[]
    shares: SharedFolder[]
    protocols: FileShareProtocolItem[]
  }
}) {
  const t = useTranslations('FileSharing')
  const [protocols, setProtocols] = useState(initialProtocols)
  const [shares, setShares] = useState<SharedFolder[]>([])
  const [storagePools, setStoragePools] = useState<StoragePoolModel[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [targetError, setTargetError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingShare, setEditingShare] = useState<SharedFolder | null>(null)
  const [form, setForm] = useState(emptyForm)

  const enabledCount = protocols.filter((item) => item.active).length
  const nfsSelected = form.protocols.includes('nfs')
  const poolById = useMemo(() => new Map(storagePools.map((pool) => [pool.id, pool])), [storagePools])
  const locationValue = useMemo<StorageLocationValue>(() => {
    const pool = poolById.get(form.storagePoolId)
    return {
      storagePoolId: form.storagePoolId,
      folderId: '',
      pathNames: getPathNames(pool, form.path),
    }
  }, [form.path, form.storagePoolId, poolById])

  useEffect(() => {
    let cancelled = false

    const loadFileSharing = async () => {
      try {
        const [poolRes, userRes, sharesRes, protocolRes] = await Promise.all([
          fetch(getStoragePoolsUrl(), { cache: 'no-store' }),
          fetch(getUsersUrl(), { cache: 'no-store' }),
          fetch(getFileSharesUrl(), { cache: 'no-store' }),
          fetch(getFileShareProtocolsUrl(), { cache: 'no-store' }),
        ])
        if (!poolRes.ok) {
          const text = await poolRes.text()
          throw new Error(parseApiErrorMessage(text, `Load storage pools failed: ${poolRes.status}`))
        }
        if (!userRes.ok) {
          const text = await userRes.text()
          throw new Error(parseApiErrorMessage(text, `Load users failed: ${userRes.status}`))
        }
        if (!sharesRes.ok) {
          const text = await sharesRes.text()
          throw new Error(parseApiErrorMessage(text, `Load file shares failed: ${sharesRes.status}`))
        }
        const poolPayload = (await poolRes.json()) as StoragePoolModel[]
        const userPayload = (await userRes.json()) as User[] | { users?: User[]; items?: User[] }
        const sharesPayload = (await sharesRes.json()) as { items?: SharedFolder[] } | SharedFolder[]
        let protocolPayload: { items?: FileShareProtocolItem[] } | null = null
        let protocolError: Error | null = null

        if (protocolRes.ok) {
          protocolPayload = (await protocolRes.json()) as { items?: FileShareProtocolItem[] }
        } else {
          const text = await protocolRes.text()
          protocolError = new Error(
            parseApiErrorMessage(text, `Load file share protocols failed: ${protocolRes.status}`),
          )
        }

        if (cancelled) return

        setStoragePools(Array.isArray(poolPayload) ? poolPayload : [])
        setUsers(Array.isArray(userPayload) ? userPayload : userPayload.users || userPayload.items || [])
        setShares((Array.isArray(sharesPayload) ? sharesPayload : sharesPayload.items || []).map(normalizeShare))
        if (protocolPayload) {
          setProtocols((current) => mergeProtocolItems(current, protocolPayload.items ?? []))
        } else if (protocolError) {
          toast.error(`${t('messages.loadProtocolsFailed')}: ${protocolError.message}`, 5000)
        }
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Load sharing options failed'
        toast.error(`${t('messages.loadOptionsFailed')}: ${message}`, 5000)
      }
    }

    void loadFileSharing()
    return () => {
      cancelled = true
    }
  }, [t])

  const refreshProtocols = async () => {
    const response = await fetch(getFileShareProtocolsUrl(), { cache: 'no-store' })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(parseApiErrorMessage(text, `Load file share protocols failed: ${response.status}`))
    }

    const payload = (await response.json()) as { items?: FileShareProtocolItem[] }
    setProtocols((current) => mergeProtocolItems(current, payload.items ?? []))
  }

  const runProtocolAction = async (protocol: ProtocolItem) => {
    const action = protocol.active ? 'stop' : 'start'

    try {
      const response = await fetch(getFileShareProtocolActionUrl(protocol.key), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(parseApiErrorMessage(text, `Update protocol failed: ${response.status}`))
      }

      await refreshProtocols()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update protocol failed'
      toast.error(`${t('messages.protocolActionFailed')}: ${message}`, 5000)
    }
  }

  const deleteShare = async (share: SharedFolder) => {
    try {
      const response = await fetch(getFileShareUrl(share.id), { method: 'DELETE' })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(parseApiErrorMessage(text, `Delete file share failed: ${response.status}`))
      }

      setShares((current) => current.filter((item) => item.id !== share.id))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete file share failed'
      toast.error(`${t('messages.deleteFailed')}: ${message}`, 5000)
    }
  }

  const columns = useMemo(
    () =>
      getFileSharingColumns({
        t,
        onEdit: (share) => {
          void openEdit(share)
        },
        onDelete: (share) => {
          void deleteShare(share)
        },
      }),
    [t, storagePools],
  )

  const openCreate = () => {
    const firstPool = storagePools[0]
    setTargetError(null)
    setEditingShare(null)
    setForm({
      ...emptyForm,
      storagePoolId: firstPool?.id ?? '',
      path: getPoolRootPath(firstPool),
    })
    setDrawerOpen(true)
  }

  const openEdit = async (share: SharedFolder) => {
    let nextShare = share

    try {
      const response = await fetch(getFileShareUrl(share.id), { cache: 'no-store' })
      if (response.ok) {
        nextShare = normalizeShare((await response.json()) as SharedFolder)
      }
    } catch {
      nextShare = share
    }

    const pool = storagePools.find((item) => {
      const root = getPoolRootPath(item)
      return root && nextShare.path.startsWith(root)
    })
    setTargetError(null)
    setEditingShare(nextShare)
    setForm({
      name: nextShare.name,
      storagePoolId: nextShare.storagePoolId || pool?.id || '',
      path: nextShare.path,
      protocols: nextShare.protocols,
      userIds: nextShare.userIds,
      clientNetworks: nextShare.clientNetworks,
      status: nextShare.status,
    })
    setDrawerOpen(true)
  }

  const handleLocationChange = (value: StorageLocationValue) => {
    const pool = poolById.get(value.storagePoolId)
    setTargetError(null)
    setForm((current) => ({
      ...current,
      storagePoolId: value.storagePoolId,
      path: pool ? joinPath(getPoolRootPath(pool), value.pathNames) : '',
    }))
  }

  const saveShare = async () => {
    if (!form.name.trim() || form.protocols.length === 0) return

    if (!form.path.trim()) {
      setTargetError(t('messages.pathRequired'))
      return
    }

    const payload = {
      name: form.name.trim(),
      storagePoolId: form.storagePoolId,
      path: form.path,
      protocols: form.protocols,
      userIds: form.userIds,
      clientNetworks: form.clientNetworks,
      status: form.status,
    }

    try {
      const response = await fetch(editingShare ? getFileShareUrl(editingShare.id) : getFileSharesUrl(), {
        method: editingShare ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(parseApiErrorMessage(text, `Save file share failed: ${response.status}`))
      }

      const savedShare = normalizeShare((await response.json()) as SharedFolder)

      if (editingShare) {
        setShares((current) => current.map((share) => (share.id === editingShare.id ? savedShare : share)))
      } else {
        setShares((current) => [savedShare, ...current])
      }
      setDrawerOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save file share failed'
      toast.error(`${t('messages.saveFailed')}: ${message}`, 5000)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return

    void saveShare()
  }

  return (
    <PageWrapper className="-mx-8 flex flex-col gap-5 overflow-y-auto px-8 pb-8 [scrollbar-gutter:stable]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle title={t('title')} subTitle={t('subtitle', { enabled: enabledCount, total: protocols.length })} />
        <Button size="sm" icon={Plus} onClick={openCreate}>
          {t('actions.create')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {protocols.map((protocol) => (
          <ProtocolCard
            key={protocol.key}
            protocol={protocol}
            onToggle={() => {
              void runProtocolAction(protocol)
            }}
          />
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionTitle level="section" title={t('sharesTitle')} subTitle={t('sharesSubtitle')} />
        </div>

        {shares.length === 0 ? (
          <EmptyState message={t('empty')} />
        ) : (
          <DataTable headers={columns} data={shares} variant="primary" />
        )}
      </section>

      <SideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingShare ? t('form.editTitle') : t('form.createTitle')}
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field label={t('form.name')}>
            <Input
              value={form.name}
              required
              placeholder="Public"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </Field>
          <Field label={t('form.protocols')}>
            <div className="flex flex-wrap gap-2">
              {protocols.map((protocol) => (
                <Checkbox
                  key={protocol.key}
                  label={t(`protocols.${protocol.key}.name`)}
                  checked={form.protocols.includes(protocol.key)}
                  onChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      protocols: checked
                        ? [...current.protocols, protocol.key]
                        : current.protocols.filter((item) => item !== protocol.key),
                    }))
                  }
                />
              ))}
            </div>
            <input type="hidden" required value={form.protocols.length > 0 ? 'selected' : ''} readOnly />
          </Field>
          <Field
            label={t('form.users')}
            extra={
              users.length > 0 ? (
                <span className="bg-app-hover text-app-text-muted inline-flex h-5 items-center rounded-full px-2 text-[10px] leading-none">
                  已选 {form.userIds.length} / {users.length}
                </span>
              ) : null
            }
          >
            {users.length > 0 ? (
              <div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {users.map((user) => (
                    <UserPicker
                      key={user.id}
                      user={user}
                      checkedIds={form.userIds}
                      onChange={(userId, checked) =>
                        setForm((current) => ({
                          ...current,
                          userIds: checked
                            ? [...current.userIds, userId]
                            : current.userIds.filter((id) => id !== userId),
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-app-text-muted text-xs">{t('form.noUsers')}</span>
            )}
            {nfsSelected ? (
              <span className="rounded-md bg-amber-500/10 px-2.5 py-2 text-xs text-amber-400">
                {t('form.nfsUserWarning')}
              </span>
            ) : null}
          </Field>
          <Field label={t('form.clientNetworks')}>
            <textarea
              value={form.clientNetworks.join('\n')}
              placeholder={'192.168.1.0/24\n192.168.1.25'}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  clientNetworks: parseClientNetworks(event.target.value),
                }))
              }
              className="border-app-border bg-app-bg text-app-text placeholder:text-app-text-muted/70 focus:border-app-border-strong min-h-20 resize-none rounded-lg border px-3 py-2 text-sm transition outline-none"
            />
            <span className="text-app-text-muted text-xs">{t('form.clientNetworksHint')}</span>
          </Field>
          <Field label={t('form.path')}>
            <StorageLocationPicker
              storagePools={storagePools}
              value={locationValue}
              onChange={handleLocationChange}
              onError={setTargetError}
              placeholder={t('form.selectLocation')}
              labels={{
                close: t('form.closeLocationPicker'),
                loadingFolders: t('form.loadingFolders'),
                noFolders: t('form.noFolders'),
              }}
            />
            <input type="hidden" value={form.path} readOnly />
            {targetError ? <span className="text-xs text-red-400">{targetError}</span> : null}
          </Field>
          <Field label={t('form.status')}>
            <Select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as ShareStatus,
                }))
              }
            >
              <option value="enabled">{t('status.enabled')}</option>
              <option value="disabled">{t('status.disabled')}</option>
            </Select>
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDrawerOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void saveShare()
              }}
            >
              {editingShare ? t('actions.save') : t('actions.create')}
            </Button>
          </div>
        </form>
      </SideDrawer>
    </PageWrapper>
  )
}

function ProtocolCard({ protocol, onToggle }: { protocol: ProtocolItem; onToggle: () => void }) {
  const t = useTranslations('FileSharing')
  const Icon = protocol.icon
  const endpoint = protocol.shareUrl

  return (
    <section className="border-app-border bg-app-bg flex min-h-[136px] flex-col rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-app-hover text-app-text inline-flex size-8 shrink-0 items-center justify-center rounded-full">
            <Icon className="size-4" />
          </span>
          <h3 className="text-app-text truncate text-sm font-semibold">{t(`protocols.${protocol.key}.name`)}</h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'relative h-5 w-10 rounded-full p-0',
            'border-none hover:text-white',
            protocol.active ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-app-hover hover:bg-app-hover',
          )}
          aria-label={t(protocol.active ? 'actions.disable' : 'actions.enable')}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0 h-4 w-4 rounded-full bg-white transition-transform',
              protocol.active ? 'translate-x-5.5' : 'translate-x-0.5',
            )}
          />
        </Button>
      </div>

      <p className="text-app-text-muted mt-2 truncate text-xs">{t(`protocols.${protocol.key}.description`)}</p>
      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px]">
        <span
          className={cn('size-1.5 shrink-0 rounded-full', protocol.active ? 'bg-emerald-400' : 'bg-app-text-muted/45')}
        />
        <span className="text-app-text-muted min-w-0 truncate">
          {protocol.serviceName} · {protocol.status} · {t('shareCount', { count: protocol.shareCount })}
        </span>
      </div>

      <div className="mt-auto flex h-9 pt-2.5">
        <div className="bg-app-hover/45 flex w-full min-w-0 items-center justify-between gap-2 rounded-md px-2.5 py-1.5">
          <div className="text-app-text min-w-0 truncate font-mono text-xs">{endpoint}</div>
          <Tooltip content={t('actions.copy')}>
            <Button variant="ghost" size="xs" icon={Copy} className="h-5 w-5 rounded p-0" />
          </Tooltip>
        </div>
      </div>
    </section>
  )
}

function Field({ label, extra, children }: { label: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-5 items-center justify-start gap-2">
        <span className="text-app-text-muted text-xs leading-none font-medium">{label}</span>
        {extra ? <span className="inline-flex h-5 shrink-0 items-center">{extra}</span> : null}
      </div>
      {children}
    </div>
  )
}
