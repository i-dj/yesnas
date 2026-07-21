import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface PillProps {
  children?: ReactNode
  count?: ReactNode
  icon?: LucideIcon
  selected?: boolean
  className?: string
  contentClassName?: string
  disabled?: boolean
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type']
  title?: string
  ariaLabel?: string
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick']
  rawContent?: boolean
  variant?: 'default' | 'plain'
}

const pillClassName =
  'inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border px-3 text-sm transition-colors'

const pillStateClassName = (selected?: boolean, interactive?: boolean, variant: PillProps['variant'] = 'default') => {
  if (variant === 'plain') {
    return cn(
      'border-app-border/60 bg-transparent text-app-text-muted',
      interactive && 'hover:border-app-border-strong hover:bg-transparent hover:text-app-text',
      selected && 'border-app-border-strong text-app-text',
    )
  }

  return selected
    ? 'border-app-border-strong bg-app-hover/80 text-app-text'
    : cn(
        'border-app-border/60 bg-app-bg/40 text-app-text-muted',
        interactive && 'hover:border-app-border-strong hover:bg-app-hover/50 hover:text-app-text',
      )
}

export function Pill({
  children,
  count,
  icon: Icon,
  selected,
  className,
  contentClassName,
  disabled,
  type = 'button',
  title,
  ariaLabel,
  onClick,
  rawContent = false,
  variant = 'default',
}: PillProps) {
  const content = (
    <>
      {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
      {children ? (
        rawContent ? (
          children
        ) : (
          <span className={cn('min-w-0 truncate', contentClassName)}>{children}</span>
        )
      ) : null}
      {count !== undefined && count !== null ? (
        <span className="bg-app-hover text-app-text-muted grid size-5 place-items-center rounded-full px-1.5 text-[10px] leading-5">
          {count}
        </span>
      ) : null}
    </>
  )

  if (onClick) {
    return (
      <button
        type={type}
        title={title}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          pillClassName,
          pillStateClassName(selected, true, variant),
          'text-left disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <span
      title={title}
      aria-label={ariaLabel}
      className={cn(pillClassName, pillStateClassName(selected, false, variant), className)}
    >
      {content}
    </span>
  )
}
