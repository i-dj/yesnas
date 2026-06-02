import { create } from 'zustand'
import type { ToastItem, ToastVariant } from '@/components/ui/toast'

interface ToastInput {
  message: string
  variant?: ToastVariant
  durationMs?: number
}

interface ToastState {
  toasts: ToastItem[]
  push: (input: ToastInput) => string
  remove: (id: string) => void
  clear: () => void
}

const defaultDurationMs = 3200

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: ({ message, variant = 'success', durationMs }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const toast: ToastItem = { id, message, variant }

    set((state) => ({ toasts: [...state.toasts, toast] }))

    const closeAfter = durationMs ?? defaultDurationMs
    if (closeAfter > 0) {
      window.setTimeout(() => {
        get().remove(id)
      }, closeAfter)
    }

    return id
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
  clear: () => set({ toasts: [] }),
}))

const notify = (variant: ToastVariant, message: string, durationMs?: number) =>
  useToastStore.getState().push({
    variant,
    message,
    durationMs,
  })

export const toast = {
  push: (input: ToastInput) => useToastStore.getState().push(input),
  success: (message: string, durationMs?: number) => notify('success', message, durationMs),
  error: (message: string, durationMs?: number) =>
    notify('error', normalizeError(message) ?? 'Unknown error', durationMs),
  info: (message: string, durationMs?: number) => notify('info', message, durationMs),
  warning: (message: string, durationMs?: number) => notify('warning', message, durationMs),
}
const normalizeError = (err: unknown): string | undefined => {
  if (!err) return undefined
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}
