'use client'

import { AvatarEditorModal, Button, Input, Select, SideDrawer } from '@/components/ui'
import { toast } from '@/store/use-toast-store'
import type { EnableStatus, User } from '@/types'
import { ImagePlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { createEmptyUserForm, type UserFormState } from '../types'
import { USER_AVATAR_PRESETS, isImageAvatar, isPresetUserAvatar } from './user-avatar'
import { Field } from '@/components/ui/form'

interface Props {
  open: boolean
  editingUser: User | null
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (form: UserFormState) => void | Promise<void>
}

export function UserFormDrawer({ open, editingUser, submitting, onOpenChange, onSubmit }: Props) {
  const t = useTranslations('Users')

  const [form, setForm] = useState<UserFormState>(createEmptyUserForm)
  const [avatarEditorImage, setAvatarEditorImage] = useState<string | File | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const update = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const resetForm = () => {
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
        : createEmptyUserForm,
    )
    setAvatarEditorImage(null)
  }

  useEffect(() => {
    if (open) resetForm()
    else setAvatarEditorImage(null)
  }, [open, editingUser])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void onSubmit(form)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(t('messages.invalidAvatar'))
      return
    }

    setAvatarEditorImage(file)
  }

  const isCustomAvatar = isImageAvatar(form.avatar) && !isPresetUserAvatar(form.avatar)

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
              onChange={(e) => update('username', e.target.value)}
            />
          </Field>

          <Field label={t('form.displayName')}>
            <Input value={form.displayName} required onChange={(e) => update('displayName', e.target.value)} />
          </Field>

          {/* avatar */}
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
                className={`h-9 w-9 rounded-full p-0 ${isCustomAvatar ? 'ring-app-accent ring-2 ring-offset-1' : ''}`}
                onClick={() => avatarInputRef.current?.click()}
              >
                {isCustomAvatar ? (
                  <img src={form.avatar} className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
              </Button>
            </div>

            <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
          </Field>

          {/* admin */}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isAdmin} onChange={(e) => update('isAdmin', e.target.checked)} />
            <span className="text-sm">{t('form.isAdmin')}</span>
          </label>

          {/* password */}
          <Field label={editingUser ? t('form.newPassword') : t('form.password')}>
            <Input
              type="password"
              value={form.password}
              required={!editingUser}
              onChange={(e) => update('password', e.target.value)}
            />
          </Field>

          {/* status */}
          <Field label={t('form.status')}>
            <Select value={form.status} onChange={(e) => update('status', e.target.value as EnableStatus)}>
              <option value="enabled">{t('statuses.enabled')}</option>
              <option value="disabled">{t('statuses.disabled')}</option>
            </Select>
          </Field>

          {/* actions */}
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

      {/* avatar editor */}
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
          update('avatar', dataUrl)
          setAvatarEditorImage(null)
        }}
      />
    </>
  )
}
