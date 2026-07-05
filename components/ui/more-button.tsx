import { cn } from '@/lib/utils'
import { Ellipsis, MoreVertical } from 'lucide-react'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'rowAction'
}

export const MoreButton = ({ className, variant = 'default', ...props }: IconButtonProps) => {
  const Icon = variant === 'rowAction' ? Ellipsis : MoreVertical

  const defaultClasses =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50 cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0'
  const rowActionClasses =
    'text-app-text-muted hover:text-app-text hover:bg-app-hover/60 border-app-border  invisible flex h-7 w-7 items-center justify-center rounded-md border opacity-0 transition-all group-hover:visible group-hover:opacity-100 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0'

  return (
    <button
      className={cn(variant === 'rowAction' ? rowActionClasses : defaultClasses, className)}
      type="button"
      {...props}
    >
      <Icon className={cn(variant === 'rowAction' ? 'h-4 w-4' : 'h-5 w-5 text-neutral-600')} />
    </button>
  )
}
