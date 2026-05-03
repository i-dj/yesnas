import { cn } from '@/lib/utils'

interface SectionTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  title: string
  icon?: React.ReactNode
  level?: 1 | 2 | 3 | 4 | 5 | 6
}
export const SectionTitle = ({
  title,
  icon,
  level = 2,
  className,
  ...props
}: SectionTitleProps) => {
  const Tag = `h${level}` as any
  const sizes = {
    1: 'text-2xl',
    2: 'text-xl',
    3: 'text-lg',
    4: 'text-base',
    5: 'text-sm',
    6: 'text-xs',
  }

  return (
    <div className={cn('flex w-fit items-center gap-2', className)}>
      {icon}
      <Tag
        className={cn(
          'leading-none font-bold tracking-tight',
          sizes[level as keyof typeof sizes],
        )}
        {...props}
      >
        {title}
      </Tag>
    </div>
  )
}
