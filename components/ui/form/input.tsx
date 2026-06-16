'use client'

import { cn } from '@/lib/utils'
import { CircleAlert } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean
  errorMessage?: ReactNode
  wrapperClassName?: string
}

export const Input = ({
  className,
  error = false,
  errorMessage,
  wrapperClassName,
  'aria-describedby': ariaDescribedBy,
  ...props
}: InputProps) => {
  const errorId = useId()
  const invalid = error || Boolean(errorMessage)
  const input = (
    <input
      className={cn(
        'app-body-text bg-app-bg border-app-border-strong/30 text-app-text placeholder:text-app-text-muted/70 h-8 w-full rounded-md border px-2.5 transition-[border-color,box-shadow,background-color] outline-none',
        'hover:border-app-border-strong focus:border-app-border-strong',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid && 'border-red-500/80 pr-9 focus:border-red-500 focus:ring-red-500/25',
        className,
      )}
      aria-invalid={invalid || undefined}
      aria-describedby={errorMessage ? errorId : ariaDescribedBy}
      {...props}
    />
  )

  if (!invalid && !wrapperClassName) return input

  return (
    <div className={cn('w-full min-w-0', wrapperClassName)}>
      <div className="relative">
        {input}
        {invalid ? (
          <CircleAlert
            className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-red-400"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {errorMessage ? (
        <p id={errorId} className="app-caption mt-1.5 text-red-400">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
