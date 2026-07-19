'use client'

import { useSse } from '@/hooks/use-sse'
import type { NetworkInterfacesSnapshot, NetworkPoint } from '@/types'
import { createContext, useContext, type ReactNode } from 'react'

const RealtimeNetworkContext = createContext<NetworkInterfacesSnapshot | null>(null)

export function RealtimeNetworkProvider({ children }: { children: ReactNode }) {
  const { data } = useSse<NetworkInterfacesSnapshot>('system.network', {
    interval: 1,
    reducer: mergeRealtimeNetworkSnapshot,
  })

  return <RealtimeNetworkContext.Provider value={data}>{children}</RealtimeNetworkContext.Provider>
}

export function useRealtimeNetwork() {
  return useContext(RealtimeNetworkContext)
}

function mergeRealtimeNetworkSnapshot(
  currentSnapshot: NetworkInterfacesSnapshot | null,
  nextSnapshot: NetworkInterfacesSnapshot,
): NetworkInterfacesSnapshot {
  return {
    ...nextSnapshot,
    range: 'realtime',
    interfaces: nextSnapshot.interfaces.map((networkInterface) => {
      const previousInterface = currentSnapshot?.interfaces.find((item) => item.name === networkInterface.name)
      const previousPoints = previousInterface?.points ?? []
      const nextPoint: NetworkPoint = {
        timestamp: nextSnapshot.checkedAt,
        rxBytesPerSec: networkInterface.speed.rxBytesPerSec,
        txBytesPerSec: networkInterface.speed.txBytesPerSec,
      }

      return {
        ...networkInterface,
        points: [...previousPoints, nextPoint].slice(-20),
      }
    }),
  }
}
