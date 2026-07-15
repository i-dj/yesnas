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
    iconClassName: 'border-emerald-400 text-emerald-400',
    panelClassName: 'bg-app-item-bg/95',
  },
  error: {
    icon: CircleAlert,
    iconClassName: 'border-red-400 text-red-400',
    panelClassName: 'bg-app-item-bg/95',
  },
  info: {
    icon: Info,
    iconClassName: 'border-sky-400 text-sky-400',
    panelClassName: 'bg-app-item-bg/95',
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: 'border-amber-400 text-amber-400',
    panelClassName: 'bg-app-item-bg/95',
  },
}

export function ToastCard({ item, onClose }: ToastCardProps) {
  const variant = item.variant ?? 'success'
  const meta = variantMeta[variant]
  const Icon = meta.icon

  return (
    <div
      className={cn(
        'bg-app-item-bg/95 text-app-text border-app-border animate-in fade-in slide-in-from-right-2 relative overflow-hidden rounded-lg border px-3 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.28)] backdrop-blur duration-150',
        meta.panelClassName,
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('inline-flex size-5 shrink-0 items-center justify-center', meta.iconClassName)}>
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-5 font-medium">{item.message}</p>
        </div>

        <button
          type="button"
          onClick={() => onClose?.(item.id)}
          className="text-app-text-muted hover:text-app-text inline-flex size-7 shrink-0 items-center justify-center rounded-md transition"
          aria-label="Close toast"
        >
          <X className="size-4" />
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
        'pointer-events-none fixed top-4 right-4 z-9999 flex w-[min(90vw,400px)] flex-col gap-2.5',
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
