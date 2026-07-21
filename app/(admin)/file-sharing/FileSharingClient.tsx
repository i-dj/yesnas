'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import {
  Button,
  Checkbox,
  DataTable,
  EmptyState,
  Input,
  Pill,
  SectionTitle,
  Select,
  SideDrawer,
  StorageLocationPicker,
  Tooltip,
  type StorageLocationValue,
} from '@/components/ui'
import { fileShareApi } from '@/lib/api/file-share.api'
import { cn } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import type { User } from '@/types'
import type { StoragePoolModel } from '@/types/models/storage'
import {
  Copy,
  ExternalLink,
  Globe2,
  HardDriveDownload,
  Network,
  Plus,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { getFileSharingColumns, UserPicker } from './components'
import type { FileShareProtocolItem, ProtocolItem, ProtocolKey, ShareStatus, SharedFolder } from './types'

const protocolIcons: Record<ProtocolKey, LucideIcon> = {
  smb: HardDriveDownload,
  ftp: UploadCloud,
  webdav: Globe2,
  nfs: Network,
}

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

const toProtocolItems = (items: FileShareProtocolItem[] = []): ProtocolItem[] =>
  items.map((item) => ({
    key: item.protocol,
    icon: protocolIcons[item.protocol],
    active: item.active,
    shareUrl: item.shareUrl,
  }))

export function FileSharingClient({
  initialData,
}: {
  initialData: {
    storagePools: StoragePoolModel[]
    users: User[]
    shares: SharedFolder[]
    protocols: { items?: FileShareProtocolItem[] }
  }
}) {
  const t = useTranslations('FileSharing')
  const [protocols, setProtocols] = useState(() => toProtocolItems(initialData.protocols.items))
  const [shares, setShares] = useState<SharedFolder[]>(() => initialData.shares.map(normalizeShare))
  const storagePools = initialData.storagePools
  const users = initialData.users
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

  const refreshProtocols = async () => {
    const payload = await fileShareApi.protocols()
    setProtocols(toProtocolItems(payload.items))
  }

  const runProtocolAction = async (protocol: ProtocolItem) => {
    const action = protocol.active ? 'stop' : 'start'

    try {
      await fileShareApi.actionProtocol(protocol.key, action)
      await refreshProtocols()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update protocol failed'
      toast.error(`${t('messages.protocolActionFailed')}: ${message}`, 5000)
    }
  }

  const deleteShare = async (share: SharedFolder) => {
    try {
      await fileShareApi.remove(share.id)
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
      nextShare = normalizeShare((await fileShareApi.get(share.id)) as SharedFolder)
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
      const saved = editingShare
        ? await fileShareApi.update(editingShare.id, payload)
        : await fileShareApi.create(payload)
      const savedShare = normalizeShare(saved as SharedFolder)

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
        <Button icon={Plus} onClick={openCreate}>
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
                <Pill variant="plain" className="h-5 px-2 text-[10px] leading-none">
                  已选 {form.userIds.length} / {users.length}
                </Pill>
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
              id="file-share-status"
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
  const href = protocol.key === 'nfs' ? `nfs://${endpoint.replace(/^nfs:\/\//, '').replace(':/', '/')}` : endpoint

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(endpoint)
    } catch {
      // Clipboard access may be unavailable in an insecure browser context.
    }
  }

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

      <p className="text-app-text mt-4 truncate">{t(`protocols.${protocol.key}.description`)}</p>
      <p className="text-app-text-muted mt-2 line-clamp-2 text-sm">{t(`protocols.${protocol.key}.connectionHint`)}</p>

      <div className="mt-auto flex h-10 pt-2.5">
        <div className="bg-app-hover/45 flex w-full min-w-0 items-center justify-between gap-2 rounded-md px-2.5 py-2">
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-app-text hover:text-app-primary flex min-w-0 items-center gap-1 truncate font-mono text-sm transition-colors"
            title={endpoint}
          >
            <span className="truncate">{endpoint}</span>
            <ExternalLink className="size-3 shrink-0" />
          </a>
          <Tooltip content={t('actions.copy')}>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              icon={Copy}
              className="h-5 w-5 rounded p-0"
              onClick={handleCopy}
            />
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
