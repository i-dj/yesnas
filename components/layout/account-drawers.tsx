'use client'

import { AvatarEditorModal, Button, Input, SideDrawer } from '@/components/ui'
import { Field } from '@/components/ui/form'
import { authApi } from '@/lib/api/auth.api'
import { cn } from '@/lib/utils'
import { toast } from '@/store/use-toast-store'
import type { AuthUser } from '@/types'
import { ImagePlus, KeyRound, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { USER_AVATAR_PRESETS, isImageAvatar, isPresetUserAvatar } from '@/app/(admin)/users/components/user-avatar'

interface ProfileDrawerProps {
  open: boolean
  user: AuthUser | null
  onOpenChange: (open: boolean) => void
  onSaved: (user: AuthUser) => void
}

export function ProfileDrawer({ open, user, onOpenChange, onSaved }: ProfileDrawerProps) {
  const t = useTranslations('Common')
  const [displayName, setDisplayName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [avatarEditorImage, setAvatarEditorImage] = useState<string | File | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    setDisplayName(user?.displayName ?? '')
    setAvatar(user?.avatar ?? '')
    setAvatarEditorImage(null)
  }, [open, user])

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.invalidAvatar'))
      return
    }
    setAvatarEditorImage(file)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextDisplayName = displayName.trim()
    if (!nextDisplayName) {
      toast.error(t('profile.displayNameRequired'))
      return
    }

    try {
      setSubmitting(true)
      const updatedUser = await authApi.updateProfile({
        displayName: nextDisplayName,
        avatar,
      })
      onSaved(updatedUser)
      toast.success(t('profile.profileSaved'))
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('profile.profileSaveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const customAvatar = isImageAvatar(avatar) && !isPresetUserAvatar(avatar)

  return (
    <>
      <SideDrawer open={open} onOpenChange={onOpenChange} title={t('profile.editProfile')} className="p-0">
        <form className="flex min-h-full flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 space-y-5 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-app-hover/70 border-app-border grid size-16 place-items-center overflow-hidden rounded-full border">
                {avatar ? (
                  <img src={avatar} alt="" className="size-full object-cover" />
                ) : (
                  <UserRound className="text-app-text-muted size-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-app-text text-sm font-semibold">{user?.username ?? '-'}</div>
                <div className="text-app-text-muted mt-1 text-xs">{t('profile.profileHint')}</div>
              </div>
            </div>

            <Field label={t('profile.displayName')}>
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </Field>

            <Field label={t('profile.avatar')}>
              <div className="flex flex-wrap gap-2">
                {USER_AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={cn(
                      'border-app-border/60 size-10 overflow-hidden rounded-full border p-0.5 transition-colors',
                      'hover:border-app-border-strong',
                      avatar === preset && 'border-sky-400/70 ring-2 ring-sky-400/25',
                    )}
                    onClick={() => setAvatar(preset)}
                  >
                    <img src={preset} alt="" className="size-full rounded-full object-cover" />
                  </button>
                ))}
                <button
                  type="button"
                  className={cn(
                    'border-app-border/60 text-app-text-muted hover:text-app-text hover:border-app-border-strong',
                    'grid size-10 place-items-center overflow-hidden rounded-full border transition-colors',
                    customAvatar && 'border-sky-400/70 ring-2 ring-sky-400/25',
                  )}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {customAvatar ? (
                    <img src={avatar} alt="" className="size-full object-cover" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                </button>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
            </Field>
          </div>

          <div className="bg-app-bg/95 border-app-border sticky bottom-0 flex justify-end gap-2 border-t px-4 py-3">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {t('actions.save')}
            </Button>
          </div>
        </form>
      </SideDrawer>

      <AvatarEditorModal
        image={avatarEditorImage}
        labels={{
          cancel: t('actions.cancel'),
          confirm: t('profile.setAvatar'),
          zoom: t('profile.avatarZoom'),
          zoomIn: t('profile.avatarZoomIn'),
          zoomOut: t('profile.avatarZoomOut'),
          rotateLeft: t('profile.avatarRotateLeft'),
          rotateRight: t('profile.avatarRotateRight'),
        }}
        onCancel={() => setAvatarEditorImage(null)}
        onConfirm={(dataUrl) => {
          setAvatar(dataUrl)
          setAvatarEditorImage(null)
        }}
      />
    </>
  )
}

interface PasswordDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PasswordDrawer({ open, onOpenChange }: PasswordDrawerProps) {
  const t = useTranslations('Common')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }, [open])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentPassword || !newPassword) {
      toast.error(t('profile.passwordRequired'))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwordMismatch'))
      return
    }

    try {
      setSubmitting(true)
      await authApi.updatePassword({ currentPassword, newPassword })
      toast.success(t('profile.passwordSaved'))
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('profile.passwordSaveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} title={t('actions.changePassword')} className="p-0">
      <form className="flex min-h-full flex-col" onSubmit={handleSubmit}>
        <div className="flex-1 space-y-5 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="bg-app-hover grid size-10 place-items-center rounded-lg">
              <KeyRound className="text-app-text-muted size-5" />
            </span>
            <p className="text-app-text-muted text-sm">{t('profile.passwordHint')}</p>
          </div>

          <Field label={t('profile.currentPassword')}>
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>
          <Field label={t('profile.newPassword')}>
            <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </Field>
          <Field label={t('profile.confirmPassword')}>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </Field>
        </div>

        <div className="bg-app-bg/95 border-app-border sticky bottom-0 flex justify-end gap-2 border-t px-4 py-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" loading={submitting}>
            {t('actions.save')}
          </Button>
        </div>
      </form>
    </SideDrawer>
  )
}
