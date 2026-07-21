import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CheckboxProps {
  label: ReactNode
  description?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  variant?: 'inline' | 'card'
  leading?: ReactNode
  className?: string
  contentClassName?: string
  markClassName?: string
  disabled?: boolean
}

export const Checkbox = ({
  label,
  description,
  checked,
  onChange,
  variant = 'inline',
  leading,
  className,
  contentClassName,
  markClassName,
  disabled = false,
}: CheckboxProps) => {
  if (variant === 'card') {
    return (
      <label
        className={cn(
          'app-body-text border-app-border bg-app-surface hover:border-app-text-muted/40 flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 transition',
          checked
            ? 'text-app-text border-app-text-muted/40 bg-app-hover/60'
            : 'text-app-text-muted hover:bg-app-hover/60',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        {leading ? <span className="shrink-0">{leading}</span> : null}
        <span className={cn('min-w-0 flex-1', contentClassName)}>
          <span className={cn('app-body-text block truncate', checked ? 'text-app-text' : 'text-app-text-muted')}>
            {label}
          </span>
          {description ? (
            <span className="app-caption text-app-text-muted mt-0.5 block truncate">{description}</span>
          ) : null}
        </span>
        <CheckboxMark checked={checked} className={markClassName} />
      </label>
    )
  }

  return (
    <label
      className={cn(
        'flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm transition',
        checked ? 'text-app-text' : 'text-app-text-muted',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <CheckboxMark checked={checked} className={markClassName} />
      {leading ? <span className="shrink-0">{leading}</span> : null}
      <span className={cn('truncate', contentClassName)}>{label}</span>
    </label>
  )
}

function CheckboxMark({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'grid size-4 shrink-0 place-items-center rounded-sm border transition',
        checked ? 'bg-app-text text-app-bg border-app-text' : 'border-app-border-strong bg-app-bg',
        className,
      )}
      aria-hidden="true"
    >
      {checked ? (
        <svg viewBox="0 0 16 16" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.25">
          <path d="M3.5 8.5 6.5 11 12.5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  )
}
