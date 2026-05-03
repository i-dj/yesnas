// PageHeader.tsx
import { cn } from '@/lib/utils'

export const PageHeader = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return <div className={cn('z-20 flex-none', className)}>{children}</div>
}
