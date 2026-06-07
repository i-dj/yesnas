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
        'bg-app-surface border-app-border rounded-lg p-3 transition-colors duration-200 ease-out',
        className,
      )}
    >
      {title && <h4 className="app-section-title mb-3">{title}</h4>}
      {children}
    </div>
  )
}
