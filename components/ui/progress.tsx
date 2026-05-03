import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  showLabel?: boolean
  className?: string
}
export const Progress = ({
  value,
  className,
  showLabel = true,
}: ProgressProps) => {
  return (
    <div className="flex w-full items-center py-2">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/50">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-in-out',
            'bg-black',
            className,
          )}
          style={{ width: `${value}%` }}
        />
      </div>

      {showLabel && (
        <span className={cn('min-w-11 text-right font-mono text-xs')}>
          {value}%
        </span>
      )}
    </div>
  )
}
