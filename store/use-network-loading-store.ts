import { create } from 'zustand'

interface NetworkLoadingState {
  pendingCount: number
  begin: () => void
  end: () => void
}

export const useNetworkLoadingStore = create<NetworkLoadingState>((set) => ({
  pendingCount: 0,
  begin: () =>
    set((state) => ({
      pendingCount: state.pendingCount + 1,
    })),
  end: () =>
    set((state) => ({
      pendingCount: Math.max(0, state.pendingCount - 1),
    })),
}))

