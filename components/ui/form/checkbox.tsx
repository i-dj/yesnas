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
}

export const Checkbox = ({
  label,
  description,
  checked,
  onChange,
  variant = 'inline',
  leading,
  className,
}: CheckboxProps) => {
  if (variant === 'card') {
    return (
      <label
        className={cn(
          'border-app-border bg-app-surface hover:border-app-text-muted/40 flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm transition',
          checked
            ? 'text-app-text border-app-text-muted/40 bg-app-hover/60'
            : 'text-app-text-muted hover:bg-app-hover/60',
          className,
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        {leading ? <span className="shrink-0">{leading}</span> : null}
        <span className="min-w-0 flex-1">
          <span
            className={(cn('text-app-text block truncate text-sm'), checked ? 'text-app-text' : 'text-app-text-muted')}
          >
            {label}
          </span>
          {description ? (
            <span className="text-app-text-muted mt-0.5 block truncate text-xs">{description}</span>
          ) : null}
        </span>
        <CheckboxMark checked={checked} />
      </label>
    )
  }

  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm transition',
        checked ? 'text-app-text' : 'text-app-text-muted',
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <CheckboxMark checked={checked} />
      <span className="truncate">{label}</span>
    </label>
  )
}

function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'border-app-border grid size-5 shrink-0 place-items-center rounded-md border transition',
        checked ? 'bg-app-text text-app-bg border-app-text' : 'bg-app-bg',
      )}
      aria-hidden="true"
    >
      {checked ? (
        <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3.5 8.5 6.5 11 12.5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  )
}
