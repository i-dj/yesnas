'use client'

import { useState } from 'react'
import type { StoragePoolModel } from '@/types/models/storage'

const initialPoolActionState = {
  poolId: null as string | null,
  modal: {
    benchmark: false,
  },
}

export function useStorageModal() {
  const [creatorSession, setCreatorSession] = useState(0)
  const [poolAction, setPoolAction] = useState(initialPoolActionState)

  const bumpCreatorSession = () => setCreatorSession((prev) => prev + 1)

  const openBenchmark = (pool: StoragePoolModel) => {
    setPoolAction({
      poolId: pool.id,
      modal: {
        benchmark: true,
      },
    })
  }

  const setBenchmarkOpen = (open: boolean) => {
    setPoolAction((prev) => ({
      ...prev,
      modal: {
        ...prev.modal,
        benchmark: open,
      },
    }))
  }

  return {
    creatorSession,
    bumpCreatorSession,
    poolAction,
    openBenchmark,
    setBenchmarkOpen,
  }
}
