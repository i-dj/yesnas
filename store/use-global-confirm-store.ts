import { create } from 'zustand'
import type { ReactNode } from 'react'

export interface GlobalConfirmOptions {
  title: string
  description: ReactNode
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  focusFirstInput?: boolean
  children?: ReactNode
  onConfirm?: () => void | Promise<void>
}

interface GlobalConfirmState {
  open: boolean
  loading: boolean
  options: GlobalConfirmOptions | null
  resolver: ((ok: boolean) => void) | null
  openConfirm: (
    options: GlobalConfirmOptions,
    resolver: (ok: boolean) => void,
  ) => void
  setLoading: (loading: boolean) => void
  resolveAndClose: (ok: boolean) => void
  close: () => void
}

const initialState = {
  open: false,
  loading: false,
  options: null,
  resolver: null,
}

export const useGlobalConfirmStore = create<GlobalConfirmState>((set, get) => ({
  ...initialState,
  openConfirm: (options, resolver) =>
    set({
      open: true,
      loading: false,
      options,
      resolver,
    }),
  setLoading: (loading) => set({ loading }),
  resolveAndClose: (ok) => {
    const resolver = get().resolver
    if (resolver) resolver(ok)
    set(initialState)
  },
  close: () => {
    const resolver = get().resolver
    if (resolver) resolver(false)
    set(initialState)
  },
}))
