import { cn } from '@/lib/utils'

export const PageWrapper = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return <div className={cn('py-10', className)}>{children}</div>
}
