'use client'

import { cn } from '@/lib/utils'
import { useId, type ReactNode } from 'react'

export interface RadioGroupOption<T extends string> {
  value: T
  label: ReactNode
  disabled?: boolean
  className?: string
}

interface RadioGroupProps<T extends string> {
  value: T
  options: readonly RadioGroupOption<T>[]
  onValueChange: (value: T) => void
  name?: string
  ariaLabel?: string
  disabled?: boolean
  className?: string
  itemClassName?: string
  variant?: 'inline' | 'card'
}

export function RadioGroup<T extends string>({
  value,
  options,
  onValueChange,
  name,
  ariaLabel,
  disabled = false,
  className,
  itemClassName,
  variant = 'inline',
}: RadioGroupProps<T>) {
  const generatedName = useId()
  const groupName = name ?? generatedName

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        variant === 'card' ? 'grid gap-2' : 'flex min-h-8 flex-wrap items-center gap-x-5 gap-y-2',
        className,
      )}
    >
      {options.map((option) => {
        const optionDisabled = disabled || option.disabled
        const checked = value === option.value

        return (
          <label
            key={option.value}
            className={cn(
              variant === 'card'
                ? 'border-app-border bg-app-bg hover:border-app-border-strong hover:bg-app-hover/60 text-app-text flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors select-text'
                : 'text-app-text flex cursor-pointer items-center gap-2 text-sm',
              variant === 'card' && checked && 'border-app-border-strong bg-app-hover',
              optionDisabled && 'cursor-not-allowed opacity-50',
              itemClassName,
              option.className,
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={value === option.value}
              disabled={optionDisabled}
              onChange={() => onValueChange(option.value)}
              className="peer sr-only"
            />
            <RadioMark className={variant === 'card' ? 'order-2 mt-1 ml-auto size-5 border' : undefined} />
            <span className={cn(variant === 'card' ? 'min-w-0 flex-1' : undefined)}>{option.label}</span>
          </label>
        )
      })}
    </div>
  )
}

function RadioMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'border-app-border-strong grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors',
        "after:size-2 after:rounded-full after:bg-current after:opacity-0 after:content-['']",
        'peer-checked:border-app-text peer-checked:after:opacity-100',
        'peer-focus-visible:ring-app-text/30 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
        className,
      )}
    />
  )
}
