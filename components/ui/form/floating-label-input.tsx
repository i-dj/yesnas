'use client'

import { cn } from '@/lib/utils'
import { CircleAlert } from 'lucide-react'
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

type FloatingLabelInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: boolean
  errorMessage?: ReactNode
  wrapperClassName?: string
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  (
    {
      label,
      className,
      error = false,
      errorMessage,
      wrapperClassName,
      disabled,
      'aria-describedby': ariaDescribedBy,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const errorId = useId()
    const inputId = id ?? generatedId
    const invalid = error || Boolean(errorMessage)

    return (
      <div className={cn('w-full min-w-0', wrapperClassName)}>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            placeholder=" "
            className={cn(
              'peer text-app-text border-app-border h-11 w-full rounded-lg border bg-transparent px-3 pt-3.5 pb-1.5 text-sm outline-none',
              'transition-[border-color,box-shadow] placeholder:text-transparent disabled:cursor-not-allowed disabled:opacity-50',
              'hover:border-app-border-strong focus:border-app-border-strong focus:ring-app-border-strong/15 focus:ring-2',
              invalid && 'border-red-500/80 pr-10 focus:border-red-500 focus:ring-red-500/20',
              className,
            )}
            aria-invalid={invalid || undefined}
            aria-describedby={errorMessage ? errorId : ariaDescribedBy}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'bg-app-bg text-app-text-muted pointer-events-none absolute top-0 left-3 -translate-y-1/2 px-1 text-xs font-medium',
              'transition-all duration-150',
              'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm',
              'peer-focus:text-app-text peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs',
              disabled && 'opacity-60',
              invalid && 'text-red-300 peer-focus:text-red-300',
            )}
          >
            {label}
          </label>
          {invalid ? (
            <CircleAlert
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-red-400"
              aria-hidden="true"
            />
          ) : null}
        </div>
        {errorMessage ? (
          <p id={errorId} className="mt-1.5 text-sm text-red-400">
            {errorMessage}
          </p>
        ) : null}
      </div>
    )
  },
)

FloatingLabelInput.displayName = 'FloatingLabelInput'
