import { cn } from '@/lib/utils'

export const PageWrapper = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden py-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
