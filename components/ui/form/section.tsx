import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface FormSectionProps {
  children: ReactNode
  className?: string
}

interface FormContentProps extends FormSectionProps {
  size?: 'md' | 'lg'
}

interface FormSectionTitleProps extends FormSectionProps {
  icon?: LucideIcon
}

export function FormSection({ children, className }: FormSectionProps) {
  return <section className={cn('space-y-2.5', className)}>{children}</section>
}

export function FormContent({ children, className, size = 'md' }: FormContentProps) {
  return (
    <div className={cn('mx-auto w-full', size === 'md' ? 'max-w-[760px]' : 'max-w-[880px]', className)}>{children}</div>
  )
}

export function FormSectionTitle({ children, className, icon: Icon }: FormSectionTitleProps) {
  return (
    <div className={cn('mb-5 flex items-center gap-3', className)}>
      <span className="text-app-text inline-flex shrink-0 items-center gap-2 text-sm font-medium">
        {Icon ? <Icon className="size-4 shrink-0" /> : null}
        {children}
      </span>
      <span className="bg-app-border h-px min-w-8 flex-1" />
    </div>
  )
}

export function FormSectionPanel({ children, className }: FormSectionProps) {
  return <div className={cn('rounded-lg', className)}>{children}</div>
}
