import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
}

export const Card = ({ children, className = '', title }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-app-surface border-app-border rounded-lg border p-3 transition-colors duration-200 ease-out',
        className,
      )}
    >
      {title && <h4 className="mb-3 text-lg font-semibold">{title}</h4>}
      {children}
    </div>
  )
}
