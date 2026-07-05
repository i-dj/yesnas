'use client'

import { cn } from '@/lib/utils'
import { useId, type ReactNode } from 'react'

export interface RadioGroupOption<T extends string> {
  value: T
  label: ReactNode
  disabled?: boolean
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
}: RadioGroupProps<T>) {
  const generatedName = useId()
  const groupName = name ?? generatedName

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('flex min-h-8 flex-wrap items-center gap-x-5 gap-y-2', className)}
    >
      {options.map((option) => {
        const optionDisabled = disabled || option.disabled

        return (
          <label
            key={option.value}
            className={cn(
              'text-app-text flex cursor-pointer items-center gap-2 text-sm',
              optionDisabled && 'cursor-not-allowed opacity-50',
              itemClassName,
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
            <span
              className={cn(
                'border-app-border-strong grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors',
                "after:size-2 after:rounded-full after:bg-current after:opacity-0 after:content-['']",
                'peer-checked:border-app-text peer-checked:after:opacity-100',
                'peer-focus-visible:ring-app-text/30 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
              )}
            />
            <span>{option.label}</span>
          </label>
        )
      })}
    </div>
  )
}
