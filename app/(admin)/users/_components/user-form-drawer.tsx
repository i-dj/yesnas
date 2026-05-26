'use client'

import { AvatarEditorModal, Button, Input, SideDrawer } from '@/components/ui'
import { toast } from '@/store/use-toast-store'
import type { User, UserStatus } from '@/types'
import { ImagePlus } from 'lucide-react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { emptyUserForm, type UserFormState } from '../_types'
import { USER_AVATAR_PRESETS, isImageAvatar, isPresetUserAvatar } from './user-avatar'

interface UserFormDrawerProps {
  open: boolean
  editingUser: User | null
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (form: UserFormState) => void | Promise<void>
}

export function UserFormDrawer({ open, editingUser, submitting, onOpenChange, onSubmit }: UserFormDrawerProps) {
  const t = useTranslations('Users')
  const [form, setForm] = useState<UserFormState>(emptyUserForm)
  const [avatarEditorImage, setAvatarEditorImage] = useState<string | File | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) {
      setAvatarEditorImage(null)
      return
    }

    setForm(
      editingUser
        ? {
            username: editingUser.username,
            displayName: editingUser.displayName,
            isAdmin: editingUser.isAdmin,
            avatar: editingUser.avatar || '',
            password: '',
            status: editingUser.status,
          }
        : emptyUserForm,
    )
    setAvatarEditorImage(null)
  }, [editingUser, open])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSubmit(form)
  }

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('messages.invalidAvatar'))
      return
    }

    setAvatarEditorImage(file)
  }

  return (
    <>
      <SideDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={editingUser ? t('form.editTitle') : t('form.createTitle')}
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field label={t('form.username')}>
            <Input
              value={form.username}
              disabled={Boolean(editingUser)}
              required
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
            />
          </Field>

          <Field label={t('form.displayName')}>
            <Input
              value={form.displayName}
              required
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
            />
          </Field>

          <Field label={t('form.avatar')}>
            <div className="grid grid-cols-9 gap-2">
              {USER_AVATAR_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="secondary"
                  className={`h-9 w-9 overflow-hidden rounded-full p-0 [&>span]:flex [&>span]:h-full [&>span]:w-full [&>span]:items-center [&>span]:justify-center ${
                    form.avatar === preset ? 'ring-app-accent ring-offset-app-bg ring-2 ring-offset-1' : ''
                  }`}
                  onClick={() => setForm((current) => ({ ...current, avatar: preset }))}
                  aria-label={t('form.avatarPreset', { preset })}
                >
                  <img src={preset} alt="" className="h-full w-full object-cover" />
                </Button>
              ))}

              <Button
                type="button"
                variant="secondary"
                className={`h-9 w-9 overflow-hidden rounded-full p-0 [&>span]:flex [&>span]:h-full [&>span]:w-full [&>span]:items-center [&>span]:justify-center ${
                  isImageAvatar(form.avatar) && !isPresetUserAvatar(form.avatar)
                    ? 'ring-app-accent ring-offset-app-bg ring-2 ring-offset-1'
                    : ''
                }`}
                onClick={() => avatarInputRef.current?.click()}
                aria-label={t('form.avatarUpload')}
              >
                {isImageAvatar(form.avatar) && !isPresetUserAvatar(form.avatar) ? (
                  <img src={form.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
              </Button>
            </div>

            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </Field>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="border-app-border h-4 w-4 rounded"
              checked={form.isAdmin}
              onChange={(event) => setForm((current) => ({ ...current, isAdmin: event.target.checked }))}
            />
            <span className="text-app-text text-sm">{t('form.isAdmin')}</span>
          </label>

          <Field label={editingUser ? t('form.newPassword') : t('form.password')}>
            <Input
              type="password"
              value={form.password}
              required={!editingUser}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </Field>

          <Field label={t('form.status')}>
            <select
              className="bg-app-bg border-app-border text-app-text focus:border-app-border-strong h-9 w-full rounded-md border px-2.5 text-sm outline-none"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as UserStatus }))}
            >
              <option value="active">{t('statuses.active')}</option>
              <option value="disabled">{t('statuses.disabled')}</option>
            </select>
          </Field>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {editingUser ? t('actions.save') : t('actions.create')}
            </Button>
          </div>
        </form>
      </SideDrawer>

      <AvatarEditorModal
        image={avatarEditorImage}
        labels={{
          cancel: t('actions.cancel'),
          confirm: t('form.setAvatar'),
          zoom: t('form.avatarZoom'),
          zoomIn: t('form.avatarZoomIn'),
          zoomOut: t('form.avatarZoomOut'),
          rotateLeft: t('form.avatarRotateLeft'),
          rotateRight: t('form.avatarRotateRight'),
        }}
        onCancel={() => setAvatarEditorImage(null)}
        onConfirm={(dataUrl) => {
          setForm((current) => ({ ...current, avatar: dataUrl }))
          setAvatarEditorImage(null)
        }}
      />
    </>
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
