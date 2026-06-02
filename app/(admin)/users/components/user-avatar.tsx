import { cn } from '@/lib/utils'
import type { User } from '@/types'
import { UserRound } from 'lucide-react'

export const USER_AVATAR_PRESETS = [
  '/avatars/adventurer-neutral-sophie.svg',
  '/avatars/adventurer-milo.svg',
  '/avatars/aneka.svg',
  '/avatars/big-smile-sophie.svg',
  '/avatars/croodles-milo.svg',
  '/avatars/felix.svg',
  '/avatars/open-peeps-sophie.svg',
  '/avatars/open-peeps-milo.svg',
] as const

export function UserAvatar({ user }: { user: User }) {
  const label = getAvatarInitial(user.displayName || user.username)

  if (isImageAvatar(user.avatar)) {
    return (
      <span className="border-app-border bg-app-bg inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-full border">
        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'border-app-border inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-slate-500/15 text-xs font-semibold text-slate-600',
      )}
    >
      {label || <UserRound className="h-4 w-4" />}
    </span>
  )
}

export function getAvatarInitial(value: string) {
  return value.trim().slice(0, 1).toUpperCase()
}

export function isImageAvatar(value: string) {
  return /^(https?:\/\/|data:image\/|\/)/i.test(value.trim())
}

export function isPresetUserAvatar(value: string) {
  return USER_AVATAR_PRESETS.includes(value as (typeof USER_AVATAR_PRESETS)[number])
}
