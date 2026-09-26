'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, Check, CircleAlert, Info, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  message: string
  variant?: ToastVariant
}

interface ToastCardProps {
  item: ToastItem
  onClose?: (id: string) => void
}

interface ToastStackProps {
  toasts: ToastItem[]
  onClose?: (id: string) => void
  className?: string
}

const variantMeta: Record<
  ToastVariant,
  {
    icon: typeof Check
    iconClassName: string
    panelClassName: string
  }
> = {
  success: {
    icon: Check,
    iconClassName: 'text-emerald-400',
    panelClassName: '',
  },
  error: {
    icon: CircleAlert,
    iconClassName: 'text-red-400',
    panelClassName: '',
  },
  info: {
    icon: Info,
    iconClassName: 'text-sky-400',
    panelClassName: '',
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: 'text-amber-400',
    panelClassName: '',
  },
}

export function ToastCard({ item, onClose }: ToastCardProps) {
  const variant = item.variant ?? 'success'
  const meta = variantMeta[variant]
  const Icon = meta.icon

  return (
    <div
      className={cn(
        'bg-card-bg border-card-border text-app-text animate-in fade-in slide-in-from-top-2 relative overflow-hidden rounded-lg border-2 px-5 py-3 duration-150',
        meta.panelClassName,
      )}
    >
      <div className="flex min-h-10 items-center gap-4">
        <div className={cn('inline-flex size-5 shrink-0 items-center justify-center', meta.iconClassName)}>
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-3 text-sm leading-5 font-medium">{item.message}</p>
        </div>

        <button
          type="button"
          onClick={() => onClose?.(item.id)}
          className="text-app-text-muted hover:text-app-text inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition"
          aria-label="Close toast"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  )
}

export function ToastStack({ toasts, onClose, className }: ToastStackProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed top-10 left-1/2 z-9999 flex w-[min(calc(100vw-32px),640px)] -translate-x-1/2 flex-col gap-3',
        className,
      )}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <ToastCard item={item} onClose={onClose} />
        </div>
      ))}
    </div>,
    document.body,
  )
}
