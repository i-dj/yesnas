'use client'

import {
  AvatarEditorModal,
  Button,
  Checkbox,
  FloatingLabelInput,
  FormContent,
  FormSectionPanel,
  RadioGroup,
} from '@/components/ui'
import { Field } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import type { Group, User } from '@/types'
import { Plus, UserRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'

import { createEmptyUserForm, type UserFormState } from '../types'
import { USER_AVATAR_PRESETS, isImageAvatar, isPresetUserAvatar } from './user-avatar'

interface UserFormProps {
  editingUser: User | null
  groups: Group[]
  submitting: boolean
  onCancel: () => void
  onSubmit: (form: UserFormState) => void | Promise<void>
  onSaveSection?: (form: Partial<UserFormState>) => void | Promise<void>
  footerClassName?: string
  contentClassName?: string
}

type UserFormSection = 'profile' | 'avatar' | 'groups' | 'access' | 'security'
type UserFormErrorKey = 'username' | 'displayName' | 'password'

function createUserFormWithRandomAvatar() {
  const avatar = USER_AVATAR_PRESETS[Math.floor(Math.random() * USER_AVATAR_PRESETS.length)] ?? ''
  return { ...createEmptyUserForm(), avatar }
}

interface UserSettingsSectionProps {
  title: string
  children: ReactNode
  saving?: boolean
  showSave?: boolean
  onSave?: () => void
}

function UserSettingsSection({ title, children, saving, showSave, onSave }: UserSettingsSectionProps) {
  const t = useTranslations('Users')

  return (
    <section className="border-app-border overflow-hidden rounded-lg border">
      <div className="space-y-5 px-6 py-6">
        <h2 className="text-app-text text-lg font-semibold">{title}</h2>
        {children}
      </div>

      {showSave ? (
        <div className="border-app-border flex justify-end border-t px-6 py-4">
          <Button type="button" variant="secondary" loading={saving} onClick={onSave}>
            {t('actions.save')}
          </Button>
        </div>
      ) : null}
    </section>
  )
}

export function UserForm({
  editingUser,
  groups,
  submitting,
  onCancel,
  onSubmit,
  onSaveSection,
  footerClassName,
  contentClassName,
}: UserFormProps) {
  const t = useTranslations('Users')

  const [form, setForm] = useState<UserFormState>(createEmptyUserForm)
  const [errors, setErrors] = useState<Partial<Record<UserFormErrorKey, string>>>({})
  const [savingSection, setSavingSection] = useState<UserFormSection | null>(null)
  const [avatarEditorImage, setAvatarEditorImage] = useState<string | File | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const update = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (key === 'username' || key === 'displayName' || key === 'password') {
      setErrors((current) => ({ ...current, [key]: undefined }))
    }
  }

  useEffect(() => {
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
        : createUserFormWithRandomAvatar(),
    )
    setErrors({})
    setAvatarEditorImage(null)
  }, [editingUser])

  const validate = (keys: UserFormErrorKey[]) => {
    const nextErrors: typeof errors = {}

    if (keys.includes('username') && !form.username.trim()) nextErrors.username = t('messages.requiredField')
    if (keys.includes('displayName') && !form.displayName.trim()) nextErrors.displayName = t('messages.requiredField')
    if (keys.includes('password') && !form.password) nextErrors.password = t('messages.requiredField')

    if (Object.keys(nextErrors).length) {
      setErrors((current) => ({ ...current, ...nextErrors }))
      return false
    }

    return true
  }

  const saveSection = async (
    section: UserFormSection,
    patch: Partial<UserFormState>,
    requiredFields: UserFormErrorKey[] = [],
  ) => {
    if (!onSaveSection || !validate(requiredFields)) return

    setSavingSection(section)
    try {
      await onSaveSection(patch)
    } finally {
      setSavingSection(null)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (editingUser) {
      void saveSection('profile', { displayName: form.displayName }, ['displayName'])
      return
    }

    if (!validate(['username', 'displayName', 'password'])) return
    void onSubmit(form)
  }

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(t('messages.invalidAvatar'))
      return
    }

    setAvatarEditorImage(file)
  }

  const isCustomAvatar = isImageAvatar(form.avatar) && !isPresetUserAvatar(form.avatar)
  const avatarLabel = form.avatar && (editingUser || isCustomAvatar) ? '当前头像' : '默认头像'
  const toggleGroup = (groupId: string, checked: boolean) => {
    update('groupIds', checked ? [...form.groupIds, groupId] : form.groupIds.filter((id) => id !== groupId))
  }

  return (
    <>
      <form className="flex min-h-full flex-col" noValidate onSubmit={handleSubmit}>
        <div className={cn('flex-1 px-5 py-6', contentClassName)}>
          <FormContent className="space-y-6" size="lg">
            <UserSettingsSection
              title="基本信息"
              showSave={Boolean(editingUser)}
              saving={savingSection === 'profile'}
              onSave={() => saveSection('profile', { displayName: form.displayName }, ['displayName'])}
            >
              <div className="grid gap-5">
                <FloatingLabelInput
                  label={t('form.username')}
                  value={form.username}
                  disabled={Boolean(editingUser)}
                  required
                  errorMessage={errors.username}
                  onChange={(event) => update('username', event.target.value)}
                />

                <FloatingLabelInput
                  label={t('form.displayName')}
                  value={form.displayName}
                  required
                  errorMessage={errors.displayName}
                  onChange={(event) => update('displayName', event.target.value)}
                />
              </div>
            </UserSettingsSection>

            <UserSettingsSection
              title="头像"
              showSave={Boolean(editingUser)}
              saving={savingSection === 'avatar'}
              onSave={() => saveSection('avatar', { avatar: form.avatar })}
            >
              <FormSectionPanel className="flex items-center gap-6">
                <div className="shrink-0 space-y-2 text-center">
                  <div className="bg-app-hover border-app-border grid size-20 place-items-center overflow-hidden rounded-full border">
                    {form.avatar ? (
                      <img src={form.avatar} alt="" className="size-full object-cover" />
                    ) : (
                      <UserRound className="text-app-text-muted size-6" />
                    )}
                  </div>
                  <p className="text-app-text-muted text-xs">{avatarLabel}</p>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {USER_AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={cn(
                          'border-app-border size-12 overflow-hidden rounded-full border p-0.5 transition-all',
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
                        'border-app-border text-app-text-muted hover:text-app-text hover:border-app-border-strong',
                        'grid size-12 place-items-center overflow-hidden rounded-full border transition-all hover:scale-105',
                        isCustomAvatar && 'border-sky-400/70 ring-2 ring-sky-400/25',
                      )}
                      onClick={() => avatarInputRef.current?.click()}
                      aria-label={t('form.avatarUpload')}
                    >
                      {isCustomAvatar ? (
                        <img src={form.avatar} alt="" className="size-full object-cover" />
                      ) : (
                        <Plus className="size-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-app-text-muted text-xs">{t('form.avatarHint')}</p>
                </div>
              </FormSectionPanel>
            </UserSettingsSection>

            <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleUpload} />

            <UserSettingsSection
              title="所属组"
              showSave={Boolean(editingUser)}
              saving={savingSection === 'groups'}
              onSave={() => saveSection('groups', { groupIds: form.groupIds })}
            >
              <Field label={t('form.groups')}>
                {groups.length ? (
                  <FormSectionPanel className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {groups.map((group) => (
                      <Checkbox
                        key={group.id}
                        variant="card"
                        label={group.name}
                        checked={form.groupIds.includes(group.id)}
                        className="w-full min-w-0 px-2 py-2"
                        onChange={(checked) => toggleGroup(group.id, checked)}
                      />
                    ))}
                  </FormSectionPanel>
                ) : (
                  <FormSectionPanel>
                    <p className="text-app-text-muted text-xs">{t('form.noGroups')}</p>
                  </FormSectionPanel>
                )}
              </Field>
            </UserSettingsSection>

            <UserSettingsSection
              title={t('form.sections.access')}
              showSave={Boolean(editingUser)}
              saving={savingSection === 'access'}
              onSave={() => saveSection('access', { status: form.status, isAdmin: form.isAdmin })}
            >
              <FormSectionPanel className="grid gap-5 sm:grid-cols-2">
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
              </FormSectionPanel>
            </UserSettingsSection>

            <UserSettingsSection
              title={t('form.sections.security')}
              showSave={Boolean(editingUser)}
              saving={savingSection === 'security'}
              onSave={() => saveSection('security', { password: form.password }, ['password'])}
            >
              <FormSectionPanel className="space-y-3">
                <FloatingLabelInput
                  label={editingUser ? t('form.newPassword') : t('form.password')}
                  type="password"
                  value={form.password}
                  required={!editingUser}
                  errorMessage={errors.password}
                  onChange={(event) => update('password', event.target.value)}
                />
                <p className="text-app-text-muted text-xs">
                  {editingUser ? t('form.passwordEditHint') : t('form.passwordCreateHint')}
                </p>
              </FormSectionPanel>
            </UserSettingsSection>
          </FormContent>
        </div>

        {!editingUser ? (
          <div
            className={cn('bg-app-bg/95 border-app-border shrink-0 border-t px-5 py-3 backdrop-blur', footerClassName)}
          >
            <FormContent className="flex justify-end gap-2" size="lg">
              <Button type="button" variant="secondary" onClick={onCancel}>
                {t('actions.cancel')}
              </Button>

              <Button type="submit" loading={submitting}>
                {t('actions.create')}
              </Button>
            </FormContent>
          </div>
        ) : null}
      </form>

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
