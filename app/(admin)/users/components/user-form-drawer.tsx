'use client'

import { AvatarEditorModal, Button, Checkbox, Input, RadioGroup, SideDrawer } from '@/components/ui'
import { Field } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import type { Group, User } from '@/types'
import { ImagePlus, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { createEmptyUserForm, type UserFormState } from '../types'
import { USER_AVATAR_PRESETS, isImageAvatar, isPresetUserAvatar } from './user-avatar'

interface Props {
  open: boolean
  editingUser: User | null
  groups: Group[]
  submitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (form: UserFormState) => void | Promise<void>
}

export function UserFormDrawer({ open, editingUser, groups, submitting, onOpenChange, onSubmit }: Props) {
  const t = useTranslations('Users')

  const [form, setForm] = useState<UserFormState>(createEmptyUserForm)
  const [errors, setErrors] = useState<Partial<Record<'username' | 'displayName' | 'password', string>>>({})
  const [avatarEditorImage, setAvatarEditorImage] = useState<string | File | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const update = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (key === 'username' || key === 'displayName' || key === 'password') {
      setErrors((current) => ({ ...current, [key]: undefined }))
    }
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
            groupIds: editingUser.groupIds ?? editingUser.groups?.map((group) => group.id) ?? [],
          }
        : createEmptyUserForm,
    )
    setErrors({})
    setAvatarEditorImage(null)
  }

  useEffect(() => {
    if (open) resetForm()
    else setAvatarEditorImage(null)
  }, [open, editingUser])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: typeof errors = {}

    if (!form.username.trim()) nextErrors.username = t('messages.requiredField')
    if (!form.displayName.trim()) nextErrors.displayName = t('messages.requiredField')
    if (!editingUser && !form.password) nextErrors.password = t('messages.requiredField')

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

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
  const toggleGroup = (groupId: string, checked: boolean) => {
    update('groupIds', checked ? [...form.groupIds, groupId] : form.groupIds.filter((id) => id !== groupId))
  }

  return (
    <>
      <SideDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={editingUser ? t('form.editTitle') : t('form.createTitle')}
        className="p-0 text-sm"
      >
        <form className="flex min-h-full flex-col" noValidate onSubmit={handleSubmit}>
          <div className="flex-1 px-5">
            <FormSection>
              <div className="space-y-4">
                <Field label={t('form.username')}>
                  <Input
                    value={form.username}
                    disabled={Boolean(editingUser)}
                    required
                    errorMessage={errors.username}
                    onChange={(e) => update('username', e.target.value)}
                  />
                </Field>

                <Field label={t('form.displayName')}>
                  <Input
                    value={form.displayName}
                    required
                    errorMessage={errors.displayName}
                    onChange={(e) => update('displayName', e.target.value)}
                  />
                </Field>
              </div>

              <Field label={t('form.avatar')}>
                <div className="flex items-center gap-4 py-1">
                  <div className="bg-app-hover/70 border-app-border/50 grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border">
                    {form.avatar ? (
                      <img src={form.avatar} alt="" className="size-full object-cover" />
                    ) : (
                      <UserRound className="text-app-text-muted size-6" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      {USER_AVATAR_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className={cn(
                            'border-app-border/60 size-9 overflow-hidden rounded-full border p-0.5 transition-all',
                            'hover:border-app-border-strong hover:scale-105',
                            form.avatar === preset && 'border-sky-400/70 ring-2 ring-sky-400/25',
                          )}
                          onClick={() => update('avatar', preset)}
                          aria-label={t('form.avatarPreset', { preset })}
                        >
                          <img src={preset} alt="" className="size-full rounded-full object-cover" />
                        </button>
                      ))}

                      <button
                        type="button"
                        className={cn(
                          'border-app-border/60 text-app-text-muted hover:text-app-text hover:border-app-border-strong',
                          'grid size-9 place-items-center overflow-hidden rounded-full border transition-all hover:scale-105',
                          isCustomAvatar && 'border-sky-400/70 ring-2 ring-sky-400/25',
                        )}
                        onClick={() => avatarInputRef.current?.click()}
                        aria-label={t('form.avatarUpload')}
                      >
                        {isCustomAvatar ? (
                          <img src={form.avatar} alt="" className="size-full object-cover" />
                        ) : (
                          <ImagePlus className="size-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-app-text-muted mt-2 text-xs">{t('form.avatarHint')}</p>
                  </div>
                </div>
              </Field>

              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleUpload} />

              <Field label={t('form.groups')}>
                {groups.length ? (
                  <div className="grid grid-cols-3 gap-2">
                    {groups.map((group) => (
                      <Checkbox
                        key={group.id}
                        variant="card"
                        label={group.name}
                        checked={form.groupIds.includes(group.id)}
                        className="min-w-0 px-2 py-2"
                        onChange={(checked) => toggleGroup(group.id, checked)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-app-text-muted text-xs">{t('form.noGroups')}</p>
                )}
              </Field>
            </FormSection>

            <FormSection>
              <Field label={t('form.status')}>
                <RadioGroup
                  name="user-status"
                  value={form.status}
                  options={[
                    { value: 'enabled', label: t('statuses.enabled') },
                    { value: 'disabled', label: t('statuses.disabled') },
                  ]}
                  onValueChange={(value) => update('status', value)}
                  ariaLabel={t('form.status')}
                />
              </Field>

              <Field label={t('form.role')}>
                <RadioGroup
                  name="user-role"
                  value={form.isAdmin ? 'admin' : 'user'}
                  options={[
                    { value: 'user', label: t('roles.user') },
                    { value: 'admin', label: t('roles.admin') },
                  ]}
                  onValueChange={(value) => update('isAdmin', value === 'admin')}
                  ariaLabel={t('form.role')}
                />
              </Field>
            </FormSection>

            <FormSection>
              <Field label={editingUser ? t('form.newPassword') : t('form.password')}>
                <Input
                  type="password"
                  value={form.password}
                  required={!editingUser}
                  errorMessage={errors.password}
                  onChange={(e) => update('password', e.target.value)}
                />
              </Field>
              <p className="text-app-text-muted text-xs">
                {editingUser ? t('form.passwordEditHint') : t('form.passwordCreateHint')}
              </p>
            </FormSection>
          </div>

          <div className="bg-app-bg/95 border-app-border sticky bottom-0 flex shrink-0 justify-end gap-2 border-t px-4 py-3 backdrop-blur">
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

function FormSection({ children }: { children: ReactNode }) {
  return (
    <section className="border-app-border -mx-1 border-b px-1 py-5 last:border-b-0">
      <div className="space-y-4">{children}</div>
    </section>
  )
}
