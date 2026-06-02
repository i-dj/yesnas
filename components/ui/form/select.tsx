'use client'

import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string
}

export function Select({ className, wrapperClassName, children, ...props }: SelectProps) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        className={cn(
          'bg-app-bg border-app-border text-app-text focus:border-app-border-strong',
          'h-9 w-full appearance-none rounded-md border px-2.5 pr-11 text-sm outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="text-app-text pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
    </div>
  )
}
