'use client'

import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      className={cn(
        'bg-app-bg border-app-border text-app-text placeholder:text-app-text-muted/70 h-9 w-full rounded-md border px-2.5 text-sm transition-colors outline-none',
        'focus:border-app-border-strong',
        className,
      )}
      {...props}
    />
  )
}
