import { create } from 'zustand'

interface NotificationState {
  count: number
  add: () => void
  subtract: () => void
  setCount: (val: number) => void
  reset: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  count: 0,
  add: () => set((state) => ({ count: state.count + 1 })),
  subtract: () => set((state) => ({ count: Math.max(0, state.count - 1) })),
  setCount: (val) => set({ count: Math.max(0, val) }),
  reset: () => set({ count: 0 }),
}))
