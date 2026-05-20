'use client'

import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, CircleAlert, Info, X } from 'lucide-react'
import { Button } from './button'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  title: string
  description?: string
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
    iconWrap: string
    panelGlow: string
    panelTone: string
  }
> = {
  success: {
    icon: Check,
    iconWrap:
      'bg-emerald-400 text-emerald-950 shadow-[0_0_0_8px_rgba(34,197,94,0.16)]',
    panelGlow:
      'before:bg-[radial-gradient(circle_at_left_center,rgba(34,197,94,0.1),transparent_82%)]',
    panelTone: 'border-emerald-500/25',
  },
  error: {
    icon: CircleAlert,
    iconWrap:
      'bg-red-400 text-red-950 shadow-[0_0_0_8px_rgba(200,113,113,0.16)]',
    panelGlow:
      'before:bg-[radial-gradient(circle_at_left_center,rgba(248,113,113,0.1),transparent_82%)]',
    panelTone: 'border-red-500/25',
  },
  info: {
    icon: Info,
    iconWrap:
      'bg-sky-400 text-sky-950 shadow-[0_0_0_8px_rgba(56,189,248,0.16)]',
    panelGlow:
      'before:bg-[radial-gradient(circle_at_left_center,rgba(56,189,248,0.1),transparent_82%)]',
    panelTone: 'border-sky-500/25',
  },
}

export function ToastCard({ item, onClose }: ToastCardProps) {
  const variant = item.variant ?? 'success'
  const meta = variantMeta[variant]
  const Icon = meta.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 44, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, y: -10, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.55 }}
      className={cn(
        'bg-app-item-bg text-app-text relative overflow-hidden rounded-2xl px-3.5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.20)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]',
        'before:pointer-events-none before:absolute before:inset-0',
        meta.panelTone,
        meta.panelGlow,
      )}
    >
      <div className="relative z-[1] flex items-center gap-4">
        <div
          className={cn(
            'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
            meta.iconWrap,
          )}
        >
          <Icon className="h-3 w-3" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-6 font-semibold tracking-[-0.01em]">
            {item.title}
          </p>
          {item.description ? (
            <p className="text-app-text-muted line-clamp-2 text-xs">
              {item.description}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onClose?.(item.id)}
          className="text-app-text-muted hover:text-app-text hover:bg-app-hover h-7 w-7 rounded-full"
          aria-label="Close toast"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
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
        'pointer-events-none fixed top-4 right-4 z-[9999] flex w-[min(90vw,400px)] flex-col gap-2.5',
        className,
      )}
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastCard item={item} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
