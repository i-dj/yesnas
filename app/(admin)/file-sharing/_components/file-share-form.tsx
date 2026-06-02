'use client'

import { Button, Checkbox, Input, Select, StorageLocationPicker } from '@/components/ui'
import type { ProtocolItem, ProtocolKey, ShareStatus, SharedFolder } from '../_types'
import type { StoragePoolModel } from '@/types/models/storage'
import type { User } from '@/types'
import type { StorageLocationValue } from '@/components/ui'
import { UserPicker } from '../_components/user-picker'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

type Props = {
  form: {
    name: string
    storagePoolId: string
    path: string
    protocols: ProtocolKey[]
    userIds: string[]
    clientNetworks: string[]
    status: ShareStatus
  }

  setForm: React.Dispatch<React.SetStateAction<any>>

  storagePools: StoragePoolModel[]
  users: User[]
  protocols: ProtocolItem[]

  targetError: string | null
  setTargetError: (v: string | null) => void

  editingShare: SharedFolder | null
  onSubmit: () => void

  onLocationChange: (v: StorageLocationValue) => void
}

const parseClientNetworks = (value: string) =>
  value
    .split(/[\n,，]/)
    .map((i) => i.trim())
    .filter(Boolean)

export function FileShareForm({
  form,
  setForm,
  storagePools,
  users,
  protocols,
  targetError,
  setTargetError,
  editingShare,
  onSubmit,
  onLocationChange,
}: Props) {
  const t = useTranslations('FileSharing')

  const nfsSelected = form.protocols.includes('nfs')

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      {/* name */}
      <Field label={t('form.name')}>
        <Input
          value={form.name}
          required
          placeholder="Public"
          onChange={(e) =>
            setForm((c: any) => ({
              ...c,
              name: e.target.value,
            }))
          }
        />
      </Field>

      {/* protocols */}
      <Field label={t('form.protocols')}>
        <div className="flex flex-wrap gap-2">
          {protocols.map((p) => (
            <Checkbox
              key={p.protocol}
              label={t(`protocols.${p.protocol}.name`)}
              checked={form.protocols.includes(p.protocol)}
              onChange={(checked) =>
                setForm((c: any) => ({
                  ...c,
                  protocols: checked
                    ? [...c.protocols, p.protocol]
                    : c.protocols.filter((x: string) => x !== p.protocol),
                }))
              }
            />
          ))}
        </div>

        <input type="hidden" required value={form.protocols.length ? '1' : ''} readOnly />
      </Field>

      {/* users */}
      <Field
        label={t('form.users')}
        extra={
          users.length ? (
            <span className="text-app-text-muted text-[10px]">
              已选 {form.userIds.length} / {users.length}
            </span>
          ) : null
        }
      >
        {users.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {users.map((u) => (
              <UserPicker
                key={u.id}
                user={u}
                checkedIds={form.userIds}
                onChange={(id, checked) =>
                  setForm((c: any) => ({
                    ...c,
                    userIds: checked ? [...c.userIds, id] : c.userIds.filter((x: string) => x !== id),
                  }))
                }
              />
            ))}
          </div>
        ) : (
          <span className="text-app-text-muted text-xs">{t('form.noUsers')}</span>
        )}

        {nfsSelected && (
          <span className="rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-400">{t('form.nfsUserWarning')}</span>
        )}
      </Field>

      {/* client networks */}
      <Field label={t('form.clientNetworks')}>
        <textarea
          value={form.clientNetworks.join('\n')}
          onChange={(e) =>
            setForm((c: any) => ({
              ...c,
              clientNetworks: parseClientNetworks(e.target.value),
            }))
          }
          className="min-h-20 w-full rounded border px-3 py-2 text-sm"
          placeholder={'192.168.1.0/24\n192.168.1.25'}
        />
        <span className="text-app-text-muted text-xs">{t('form.clientNetworksHint')}</span>
      </Field>

      {/* path */}
      <Field label={t('form.path')}>
        <StorageLocationPicker
          storagePools={storagePools}
          value={{
            storagePoolId: form.storagePoolId,
            folderId: '',
            pathNames: [],
          }}
          onChange={onLocationChange}
          onError={setTargetError}
        />

        <input type="hidden" value={form.path} readOnly />

        {targetError && <span className="text-xs text-red-400">{targetError}</span>}
      </Field>

      {/* status */}
      <Field label={t('form.status')}>
        <Select
          value={form.status}
          onChange={(e) =>
            setForm((c: any) => ({
              ...c,
              status: e.target.value,
            }))
          }
        >
          <option value="enabled">{t('status.enabled')}</option>
          <option value="disabled">{t('status.disabled')}</option>
        </Select>
      </Field>

      {/* actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary">
          {t('actions.cancel')}
        </Button>
        <Button type="submit">{editingShare ? t('actions.save') : t('actions.create')}</Button>
      </div>
    </form>
  )
}

/** simple field wrapper */
function Field({ label, extra, children }: { label: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">{label}</span>
        {extra}
      </div>
      {children}
    </div>
  )
}
