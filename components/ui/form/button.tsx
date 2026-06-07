'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash2, LucideIcon } from 'lucide-react'
import { IconType } from 'react-icons'
import { Tooltip } from '../tooltip'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconType | LucideIcon
  iconSize?: number
  iconClassName?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'borderghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  isDelete?: boolean
  badge?: number
  tip?: string
  noHover?: boolean
  loading?: boolean
}

// badge: numeric indicator shown in the top-right corner
export const Button = ({
  icon: Icon,
  iconSize: providedIconSize,
  iconClassName,
  variant = 'primary',
  size = 'md',
  isDelete = false,
  children,
  className,
  badge,
  tip,
  noHover = false,
  loading = false,
  ...props
}: ButtonProps) => {
  const FinalIcon = isDelete ? Icon || Trash2 : Icon

  const baseVariants = {
    primary: 'bg-app-text text-app-bg border border-transparent',
    secondary: 'bg-app-surface text-app-text-muted border border-app-border',
    danger: 'bg-app-surface text-red-500 border border-red-500/60',
    ghost: 'bg-transparent text-app-text-muted border-none',
    borderghost: 'bg-app-surface text-app-text-muted border border-app-text-muted/25',
  }

  const hoverVariants = {
    primary: 'enabled:hover:opacity-85 enabled:hover:shadow-xs enabled:active:scale-[0.97]',
    secondary:
      'enabled:hover:border-app-border-strong enabled:hover:text-app-text enabled:hover:shadow-xs enabled:active:bg-app-active',
    danger:
      'enabled:hover:bg-red-500/8 enabled:hover:text-red-600 enabled:hover:shadow-xs enabled:active:bg-red-500/12',
    ghost: 'enabled:hover:bg-app-hover enabled:hover:text-app-text enabled:active:bg-app-active',
    borderghost:
      'enabled:hover:bg-app-hover enabled:hover:border-app-text-muted/40 enabled:hover:text-app-text enabled:active:bg-app-active',
  }

  const sizes = {
    xs: 'h-6 px-1.5 text-xs gap-1.5 rounded',
    sm: 'h-8 px-2 text-[12px]   gap-1.5 rounded-lg',
    md: 'h-9 px-4 text-xs gap-2 rounded-lg',
    lg: 'h-11 px-6 text-base gap-2.5 rounded-lg',
  }

  const autoIconSize = {
    xs: 13,
    sm: 14,
    md: 18,
    lg: 20,
  }

  const finalIconSize = providedIconSize || autoIconSize[size]
  const finalVariant = isDelete && variant !== 'ghost' ? 'danger' : variant

  const variantClass = cn(baseVariants[finalVariant], !noHover && hoverVariants[finalVariant])

  const ButtonElement = (
    <button
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        'whitespace-nowrap transition-all outline-none select-none disabled:opacity-30',
        sizes[size],
        variantClass,
        !children && ['aspect-square px-0', variant === 'ghost' ? 'rounded-full' : ''],
        isDelete && variant === 'ghost' && 'text-red-500 enabled:hover:bg-red-500/10 enabled:hover:text-red-600',
        className,
      )}
      {...props}
      disabled={loading || props.disabled}
    >
      <AnimatePresence>
        {badge !== undefined && badge > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className={cn(
              'pointer-events-none absolute flex items-center justify-center rounded-full font-bold text-white shadow-sm',
              'border-2 border-white bg-red-500',
              size === 'sm' ? '-top-1 -right-1 h-4 min-w-4 text-[9px]' : '-top-1.5 -right-1.5 h-5 min-w-5 text-[10px]',
            )}
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}
      </AnimatePresence>

      {FinalIcon && <FinalIcon size={finalIconSize} className={cn('shrink-0', iconClassName)} />}
      {children && <span>{children}</span>}
    </button>
  )

  if (!tip) return ButtonElement

  return (
    <Tooltip content={tip} side="bottom" sideOffset={6}>
      {ButtonElement}
    </Tooltip>
  )
}
