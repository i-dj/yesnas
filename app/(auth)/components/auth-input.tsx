'use client'

import { cn } from '@/lib/utils'
import type { InputHTMLAttributes } from 'react'

type AuthInputProps = InputHTMLAttributes<HTMLInputElement>

export function AuthInput({ className, ...props }: AuthInputProps) {
  return (
    <input
      className={cn(
        'h-14 w-full rounded-lg border border-[#e2e5ec] bg-white px-5 text-base text-[#242733] outline-none transition',
        'placeholder:text-[#a2a5ad] hover:border-[#cbd0db] focus:border-theme focus:ring-4 focus:ring-theme/15',
        className,
      )}
      {...props}
    />
  )
}
