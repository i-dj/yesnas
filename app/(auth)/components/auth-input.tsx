'use client'

import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

type AuthInputProps = InputHTMLAttributes<HTMLInputElement>

export function AuthInput({ className, ...props }: AuthInputProps) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-base text-white outline-none transition',
        'placeholder:text-white/35 hover:border-white/20 hover:bg-white/7 focus:border-theme focus:ring-4 focus:ring-theme/20',
        className,
      )}
      {...props}
    />
  )
}
