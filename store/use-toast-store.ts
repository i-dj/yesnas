import { create } from 'zustand'
import type { ToastItem, ToastVariant } from '@/components/ui/toast'

interface ToastInput {
  title: string
  description?: string
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
  push: ({ title, description, variant = 'success', durationMs }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const toast: ToastItem = { id, title, description, variant }

    set((state) => ({ toasts: [...state.toasts, toast] }))

    const closeAfter = durationMs ?? defaultDurationMs
    if (closeAfter > 0) {
      window.setTimeout(() => {
        get().remove(id)
      }, closeAfter)
    }

    return id
  },
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
  clear: () => set({ toasts: [] }),
}))

const notify = (
  variant: ToastVariant,
  title: string,
  description?: string,
  durationMs?: number,
) =>
  useToastStore.getState().push({
    variant,
    title,
    description,
    durationMs,
  })

export const toast = {
  push: (input: ToastInput) => useToastStore.getState().push(input),
  success: (title: string, description?: string, durationMs?: number) =>
    notify('success', title, description, durationMs),
  error: (title: string, description?: string, durationMs?: number) =>
    notify('error', title, description, durationMs),
  info: (title: string, description?: string, durationMs?: number) =>
    notify('info', title, description, durationMs),
}
