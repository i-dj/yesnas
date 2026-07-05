import { cn } from '@/lib/utils'

export const PageWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div
      className={cn(
        'app-body-text -mx-8 flex min-h-0 flex-none flex-col gap-4 overflow-visible overflow-y-auto px-8 py-6 pb-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
