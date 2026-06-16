'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash2, Loader2, LucideIcon } from 'lucide-react'
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

export const Button = ({
  icon: Icon,
  iconSize,
  iconClassName,
  variant = 'primary',
  size = 'md',
  isDelete,
  children,
  className,
  badge,
  tip,
  noHover,
  loading,
  ...props
}: ButtonProps) => {
  const FinalIcon = loading ? Loader2 : isDelete ? Icon || Trash2 : Icon

  const variants = {
    primary: 'bg-app-text text-app-bg border border-transparent',
    secondary: 'bg-app-surface text-app-text-muted border border-app-border',
    danger: 'bg-app-surface text-red-500 border border-red-500/60',
    ghost: 'bg-transparent text-app-text-muted border-none',
    borderghost: 'bg-app-surface text-app-text-muted border border-app-text-muted/25',
  }

  const hovers = {
    primary: 'enabled:hover:opacity-85 enabled:active:scale-[0.97]',
    secondary: 'enabled:hover:border-app-border-strong enabled:hover:text-app-text',
    danger: 'enabled:hover:bg-red-500/8 enabled:hover:text-red-600',
    ghost: 'enabled:hover:bg-app-hover enabled:hover:text-app-text',
    borderghost: 'enabled:hover:bg-app-hover enabled:hover:text-app-text',
  }

  const sizes = {
    xs: 'h-6 px-1.5 text-xs gap-1.5 rounded',
    sm: 'h-8 px-2 text-[12px] gap-1.5 rounded-lg',
    md: 'h-9 px-4 text-xs gap-2 rounded-lg',
    lg: 'h-11 px-6 text-base gap-2.5 rounded-lg',
  }

  const autoIconSize = { xs: 13, sm: 14, md: 18, lg: 20 }

  const finalVariant = isDelete && variant !== 'ghost' ? 'danger' : variant

  const ButtonCore = (
    <button
      className={cn(
        'relative inline-flex items-center justify-center whitespace-nowrap transition-all',
        'outline-none select-none disabled:opacity-30',
        sizes[size],
        cn(variants[finalVariant], !noHover && hovers[finalVariant]),
        !children && 'aspect-square px-0',
        className,
      )}
      {...props}
      disabled={loading || props.disabled}
    >
      <AnimatePresence>
        {badge && badge > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className={cn(
              'absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center',
              'rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm',
            )}
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}
      </AnimatePresence>

      {FinalIcon && (
        <FinalIcon
          size={iconSize || autoIconSize[size]}
          className={cn('shrink-0', iconClassName, loading && 'animate-spin')}
        />
      )}

      {!loading && children && <span>{children}</span>}
    </button>
  )

  if (!tip) return ButtonCore

  return (
    <Tooltip content={tip} side="bottom" sideOffset={6}>
      {ButtonCore}
    </Tooltip>
  )
}
