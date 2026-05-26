'use client'

import { PageWrapper } from '@/components/layout/page-wrapper'
import {
  ActionMenu,
  Button,
  DataTable,
  EmptyState,
  Input,
  MoreButton,
  SectionTitle,
  SideDrawer,
  StorageLocationPicker,
  type ActionMenuConfig,
  type DataTableHeader,
  type StorageLocationValue,
} from '@/components/ui'
import {
  applySmbConfig,
  createSmbShare,
  deleteSmbShare,
  updateSmbShare,
} from '@/lib/server/file-service'
import { cn, formatDateTime } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import type { SmbShare, SmbSharePayload, User } from '@/types'
import type { StoragePoolModel } from '@/types/models/storage'
import { Edit3, FolderInput, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

interface SmbClientProps {
  shares: SmbShare[]
  users: User[]
  storagePools: StoragePoolModel[]
  timeZone: string
}

type SmbFormState = SmbSharePayload

const emptyForm: SmbFormState = {
  name: '',
  storagePoolId: '',
  path: '',
  enabled: true,
  browseable: true,
  readOnly: false,
  userIds: [],
}

const getPoolRootPath = (pool?: StoragePoolModel) => pool?.dataPath || pool?.mountPath || ''

const joinPath = (root: string, names: string[]) => {
  const cleanRoot = root.replace(/\/+$/, '')
  return names.length > 0 ? `${cleanRoot}/${names.join('/')}` : cleanRoot
}

const getPathNames = (pool: StoragePoolModel | undefined, path: string) => {
  const root = getPoolRootPath(pool)
  if (!root || !path.startsWith(root)) return []
  return path
    .slice(root.length)
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
}

const actionItems = (t: ReturnType<typeof useTranslations>): ActionMenuConfig[] => [
  { label: t('actions.edit'), action: 'edit', icon: Edit3 },
  { label: t('actions.delete'), action: 'delete', icon: Trash2, isDelete: true },
]

export function SmbClient({ shares, users, storagePools, timeZone }: SmbClientProps) {
  const t = useTranslations('Smb')
  const router = useRouter()
  const [shareList, setShareList] = useState(shares)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingShare, setEditingShare] = useState<SmbShare | null>(null)
  const [form, setForm] = useState<SmbFormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    setShareList(shares)
  }, [shares])

  const poolById = useMemo(() => new Map(storagePools.map((pool) => [pool.id, pool])), [storagePools])
  const userById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users])
  const locationValue = useMemo<StorageLocationValue>(() => {
    const pool = poolById.get(form.storagePoolId)
    return {
      storagePoolId: form.storagePoolId,
      folderId: '',
      pathNames: getPathNames(pool, form.path),
    }
  }, [form.path, form.storagePoolId, poolById])

  const handleLocationChange = (value: StorageLocationValue) => {
    const pool = poolById.get(value.storagePoolId)
    setForm((current) => ({
      ...current,
      storagePoolId: value.storagePoolId,
      path: pool ? joinPath(getPoolRootPath(pool), value.pathNames) : '',
    }))
  }

  const openCreate = () => {
    const firstPool = storagePools[0]
    setEditingShare(null)
    setForm({
      ...emptyForm,
      storagePoolId: firstPool?.id ?? '',
      path: getPoolRootPath(firstPool),
    })
    setDrawerOpen(true)
  }

  const openEdit = (share: SmbShare) => {
    setEditingShare(share)
    setForm({
      name: share.name,
      storagePoolId: share.storagePoolId,
      path: share.path,
      enabled: share.enabled,
      browseable: share.browseable,
      readOnly: share.readOnly,
      userIds: share.userIds,
    })
    setDrawerOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.storagePoolId || !form.path) {
      toast.error(t('messages.saveFailed'), t('form.selectLocation'), 5000)
      return
    }
    setSubmitting(true)
    try {
      const saved = editingShare
        ? await updateSmbShare(editingShare.id, form)
        : await createSmbShare(form)
      setShareList((current) =>
        editingShare ? current.map((share) => (share.id === saved.id ? saved : share)) : [saved, ...current],
      )
      setDrawerOpen(false)
      toast.success(editingShare ? t('messages.updated') : t('messages.created'))
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('messages.saveFailed')
      toast.error(t('messages.saveFailed'), message, 5000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (share: SmbShare) => {
    try {
      await deleteSmbShare(share.id)
      setShareList((current) => current.filter((item) => item.id !== share.id))
      toast.success(t('messages.deleted'))
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('messages.deleteFailed')
      toast.error(t('messages.deleteFailed'), message, 5000)
    }
  }

  const handleApply = async () => {
    setApplying(true)
    try {
      await applySmbConfig()
      toast.success(t('messages.applied'))
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : t('messages.applyFailed')
      toast.error(t('messages.applyFailed'), message, 5000)
    } finally {
      setApplying(false)
    }
  }

  const columns = useMemo<DataTableHeader<SmbShare>[]>(
    () => [
      {
        key: 'name',
        label: t('columns.share'),
        width: '320px',
        render: (_, record) => (
          <div className="flex min-w-0 items-center gap-3">
            <span className="border-app-border bg-app-bg inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border">
              <FolderInput className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-app-text truncate text-sm font-medium">{record.name}</div>
              <div className="text-app-text-muted truncate text-xs">{record.path}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'storagePoolId',
        label: t('columns.pool'),
        width: '220px',
        render: (value: string) => (
          <span className="text-app-text-muted text-sm">{poolById.get(value)?.name ?? value}</span>
        ),
      },
      {
        key: 'enabled',
        label: t('columns.flags'),
        width: '220px',
        render: (_, record) => (
          <div className="flex flex-wrap gap-1.5">
            <Flag active={record.enabled}>{t(record.enabled ? 'flags.enabled' : 'flags.disabled')}</Flag>
            <Flag active={record.browseable}>{t('flags.browseable')}</Flag>
            <Flag active={record.readOnly}>{t('flags.readOnly')}</Flag>
          </div>
        ),
      },
      {
        key: 'userIds',
        label: t('columns.users'),
        width: '260px',
        render: (value: string[] | null) => {
          const userIds = Array.isArray(value) ? value : []
          return (
            <span className="text-app-text-muted text-sm">
              {userIds.map((id) => userById.get(id)?.displayName || userById.get(id)?.username || id).join(', ') || '-'}
            </span>
          )
        },
      },
      {
        key: 'updatedAt',
        label: t('columns.updatedAt'),
        width: '190px',
        render: (_, record) => (
          <span className="text-app-text-muted text-sm">{formatDateTime(record.updatedAt, timeZone)}</span>
        ),
      },
      {
        key: '__actions__',
        label: '',
        width: '56px',
        align: 'right',
        render: (_, record) => (
          <ActionMenu
            mode="left-click"
            align="end"
            items={actionItems(t)}
            onAction={(action) => {
              if (action === 'edit') openEdit(record)
              if (action === 'delete') void handleDelete(record)
            }}
            trigger={
              <MoreButton
                variant="rowAction"
                aria-label={t('actions.more')}
                onClick={(event) => event.stopPropagation()}
              />
            }
          />
        ),
      },
    ],
    [poolById, t, timeZone, userById],
  )

  return (
    <PageWrapper className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle title={t('title')} subTitle={t('subtitle')} />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" icon={RefreshCw} loading={applying} onClick={handleApply}>
            {t('actions.apply')}
          </Button>
          <Button size="sm" icon={Plus} onClick={openCreate}>
            {t('actions.create')}
          </Button>
        </div>
      </div>

      <DataTable headers={columns} data={shareList} variant="primary" />
      {shareList.length === 0 ? <EmptyState message={t('empty')} /> : null}

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
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </Field>
          <Field label={t('form.location')}>
            <StorageLocationPicker
              storagePools={storagePools}
              value={locationValue}
              onChange={handleLocationChange}
              placeholder={t('form.selectLocation')}
              labels={{
                close: t('form.closeLocationPicker'),
                loadingFolders: t('form.loadingFolders'),
                noFolders: t('form.noFolders'),
              }}
            />
            <input type="hidden" required value={form.storagePoolId && form.path ? form.path : ''} readOnly />
          </Field>
          <div className="grid gap-2">
            <Checkbox
              label={t('form.enabled')}
              checked={form.enabled}
              onChange={(checked) => setForm((current) => ({ ...current, enabled: checked }))}
            />
            <Checkbox
              label={t('form.browseable')}
              checked={form.browseable}
              onChange={(checked) => setForm((current) => ({ ...current, browseable: checked }))}
            />
            <Checkbox
              label={t('form.readOnly')}
              checked={form.readOnly}
              onChange={(checked) => setForm((current) => ({ ...current, readOnly: checked }))}
            />
          </div>
          <Field label={t('form.users')}>
            <div className="border-app-border bg-app-bg grid max-h-48 gap-2 overflow-auto rounded-md border p-2">
              {users.length === 0 ? (
                <span className="text-app-text-muted text-sm">{t('form.noUsers')}</span>
              ) : (
                users.map((user) => (
                  <Checkbox
                    key={user.id}
                    label={user.displayName || user.username}
                    checked={form.userIds.includes(user.id)}
                    onChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        userIds: checked
                          ? [...current.userIds, user.id]
                          : current.userIds.filter((id) => id !== user.id),
                      }))
                    }
                  />
                ))
              )}
            </div>
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDrawerOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {editingShare ? t('actions.save') : t('actions.create')}
            </Button>
          </div>
        </form>
      </SideDrawer>
    </PageWrapper>
  )
}

function Flag({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
        active ? 'bg-sky-500/10 text-sky-500' : 'bg-zinc-500/10 text-zinc-500',
      )}
    >
      {children}
    </span>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-app-text h-4 w-4"
      />
      <span className="text-app-text">{label}</span>
    </label>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-app-text-muted text-xs font-medium">{label}</span>
      {children}
    </label>
  )
}
