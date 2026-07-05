'use client'

import type { StoragePoolModel } from '@/types/models/storage'
import type { BenchmarkSizeGiB } from '../../hooks/useStorageBenchmark'
import type { useStorageModal } from '../../hooks/useStorageModal'
import { StoragePoolBenchmark, type BenchmarkViewState } from '../storage-pool-benchmark'

type StorageModalState = ReturnType<typeof useStorageModal>

interface StorageModalsProps {
  storageModal: StorageModalState
  benchmarkPool: StoragePoolModel | null
  benchmarkState: BenchmarkViewState
  activeBenchmarkPoolId: string | null
  onBenchmarkOpenChange: (open: boolean) => void
  onBenchmarkSizeChange: (size: BenchmarkSizeGiB) => void
  onBenchmarkStart: () => void
  onBenchmarkStop: () => void
}

export function StorageModals({
  storageModal,
  benchmarkPool,
  benchmarkState,
  activeBenchmarkPoolId,
  onBenchmarkOpenChange,
  onBenchmarkSizeChange,
  onBenchmarkStart,
  onBenchmarkStop,
}: StorageModalsProps) {
  return (
    <StoragePoolBenchmark
      open={storageModal.poolAction.modal.benchmark}
      pool={benchmarkPool}
      state={benchmarkState}
      onOpenChange={(open) => {
        if (!open && activeBenchmarkPoolId) onBenchmarkStop()
        onBenchmarkOpenChange(open)
      }}
      onSizeChange={(size) => onBenchmarkSizeChange(size as BenchmarkSizeGiB)}
      onStart={onBenchmarkStart}
      onStop={onBenchmarkStop}
    />
  )
}
