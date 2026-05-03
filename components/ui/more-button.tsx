import { cn } from '@/lib/utils'
import { MoreVertical } from 'lucide-react'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const MoreButton = ({ className, ...props }: IconButtonProps) => {
  const Icon = MoreVertical

  const defaultClasses =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50 cursor-pointer'

  return (
    <button className={cn(defaultClasses, className)} type="button" {...props}>
      <Icon className="h-5 w-5 text-neutral-600" />
    </button>
  )
}
