import { Layers, type LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'

type ColumnIconType = LucideIcon | ComponentType<{ className?: string }>

interface ColumnIconBadge {
  icon: LucideIcon
  className?: string
  iconClassName?: string
}

interface ColumnIconProps {
  title?: string
  subTitle?: string
  icon?: ColumnIconType
  badge?: ColumnIconBadge | null
  className?: string
  iconClassName?: string
}

export const ColumnIcon = ({
  title,
  subTitle,
  icon: Icon = Layers,
  badge,
  className,
  iconClassName,
}: ColumnIconProps) => {
  const BadgeIcon = badge?.icon

  return (
    <div className={cn('flex min-w-0 items-center gap-5', className)}>
      <div className="border-app-border-strong bg-app-bg relative z-10 mb-0.5 inline-flex items-center justify-center overflow-visible rounded-full border p-2">
        <Icon className={cn('h-4.5 w-4.5', iconClassName)} />

        {BadgeIcon ? (
          <span
            className={cn(
              'absolute -right-1 -bottom-0.5 z-20 inline-flex h-4 w-4 items-center justify-center rounded-full text-white',
              badge.className,
            )}
          >
            <BadgeIcon className={cn('h-2.5 w-2.5', badge.iconClassName)} />
          </span>
        ) : null}
      </div>

      {(title || subTitle) && (
        <div className="flex min-w-0 flex-col gap-0.5">
          {title ? <div className="text-app-text truncate text-sm font-medium">{title}</div> : null}
          {subTitle ? <div className="text-app-text-muted truncate text-[13px]">{subTitle}</div> : null}
        </div>
      )}
    </div>
  )
}
