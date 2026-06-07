'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const DRAWER_OPEN_COUNT_KEY = '__yesnas_side_drawer_open_count__'

interface SideDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  onAfterOpen?: () => void
  className?: string
}

export function SideDrawer({ open, onOpenChange, title, children, onAfterOpen, className }: SideDrawerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open || !onAfterOpen) return
    const timer = window.setTimeout(() => {
      onAfterOpen()
    }, 220)
    return () => window.clearTimeout(timer)
  }, [open, onAfterOpen])

  useEffect(() => {
    if (!open) return

    const globalWithDrawerCount = window as Window & {
      [DRAWER_OPEN_COUNT_KEY]?: number
    }
    globalWithDrawerCount[DRAWER_OPEN_COUNT_KEY] = (globalWithDrawerCount[DRAWER_OPEN_COUNT_KEY] ?? 0) + 1

    const { body, documentElement } = document
    const prevBodyOverflow = body.style.overflow
    const prevHtmlOverflow = documentElement.style.overflow

    body.style.overflow = 'hidden'
    documentElement.style.overflow = 'hidden'

    return () => {
      globalWithDrawerCount[DRAWER_OPEN_COUNT_KEY] = Math.max(
        0,
        (globalWithDrawerCount[DRAWER_OPEN_COUNT_KEY] ?? 1) - 1,
      )
      body.style.overflow = prevBodyOverflow
      documentElement.style.overflow = prevHtmlOverflow
    }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 transition-opacity duration-200',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/45" onClick={() => onOpenChange(false)} />

      <aside
        className={cn(
          'bg-app-bg border-app-border absolute top-0 right-0 flex h-full w-full max-w-xl flex-col border-l shadow-2xl transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="border-app-border flex h-12.5 shrink-0 items-center justify-between border-b px-4 text-center">
          <h2 className="app-section-title text-app-text">{title}</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-app-text-muted hover:text-app-text hover:bg-app-hover/60 rounded-md p-1 transition-colors"
            aria-label="Close details panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className={cn(
            'min-h-0 flex-1 overflow-x-hidden overflow-y-auto [overscroll-behavior:contain] p-4 [scrollbar-gutter:stable]',
            className,
          )}
        >
          {children}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
