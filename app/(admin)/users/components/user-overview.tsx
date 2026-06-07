import { ShieldCheck, UserCheck, UsersRound, UserX, type LucideIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type { User } from '@/types'

const toneClasses = {
  sky: 'bg-sky-500/10 text-sky-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  zinc: 'bg-zinc-500/10 text-zinc-400',
  amber: 'bg-amber-500/10 text-amber-400',
}

export function UserOverview({ users }: { users: User[] }) {
  const t = useTranslations('Users')
  const items: Array<{ label: string; value: number; icon: LucideIcon; tone: keyof typeof toneClasses }> = [
    { label: t('overview.total'), value: users.length, icon: UsersRound, tone: 'sky' },
    {
      label: t('overview.enabled'),
      value: users.filter((user) => user.status === 'enabled').length,
      icon: UserCheck,
      tone: 'emerald',
    },
    {
      label: t('overview.disabled'),
      value: users.filter((user) => user.status === 'disabled').length,
      icon: UserX,
      tone: 'zinc',
    },
    {
      label: t('overview.admins'),
      value: users.filter((user) => user.isAdmin).length,
      icon: ShieldCheck,
      tone: 'amber',
    },
  ]

  return (
    <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-app-surface flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5">
          <span className={`grid size-9 shrink-0 place-items-center rounded-md ${toneClasses[item.tone]}`}>
            <item.icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-app-text text-lg leading-none font-semibold">{item.value}</p>
            <p className="app-body-text text-app-text-muted mt-1 truncate">{item.label}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
