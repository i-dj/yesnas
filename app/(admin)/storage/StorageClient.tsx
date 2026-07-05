'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { toast } from '@/store/use-toast-store'
import { bytesFormat } from '@/lib/utils'
import { useDrawerGroup } from '@/hooks/use-drawer-group'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'
import { usePoolSource } from './hooks/usePoolSource'
import { useStorageActions } from './hooks/useStorageActions'
import { useStorageBenchmark, type BenchmarkSizeGiB } from './hooks/useStorageBenchmark'
import { useStorageConfirmActions } from './hooks/useStorageConfirmActions'
import { useStorageModal } from './hooks/useStorageModal'
import { useStorageTable } from './hooks/useStorageTable'
import type { PoolSource, StorageDrawerKey } from './types'
import { toNetworkStoragePool } from './utils'
import { getStoragePoolColumns, StorageContent, StorageDrawers, StorageHeader, StorageModals } from './components'

interface StorageClientProps {
  diskList: DiskModel[]
  storagePools: StoragePoolModel[]
  initialPoolSource: PoolSource
}

export function StorageClient({ diskList, storagePools, initialPoolSource }: StorageClientProps) {
  const router = useRouter()
  const { poolSource, changePoolSource, handlePoolSourceAnchorClick } = usePoolSource(initialPoolSource)
  const drawers = useDrawerGroup<StorageDrawerKey>([
    'disk',
    'creator',
    'poolDetail',
    'snapshotManager',
    'networkCreator',
  ])
  const { poolList, replaceCandidates, removePool, updatePool, upsertPool, updatePoolBenchmark } = useStorageTable({
    diskList,
    storagePools,
  })
  const storageModal = useStorageModal()
  const storageActions = useStorageActions({
    onPoolDeleted: removePool,
    onPoolFormatted: updatePool,
    onPoolUpdated: updatePool,
  })
  const storageConfirmActions = useStorageConfirmActions(storageActions)

  const benchmark = useStorageBenchmark({
    onCompleted: (poolId, data) => {
      updatePoolBenchmark(poolId, data)
      storageModal.setBenchmarkOpen(false)
      toast.success(
        data.writeSpeedBytesPerSec && data.readSpeedBytesPerSec
          ? `Benchmark completed: Read ${bytesFormat(data.readSpeedBytesPerSec, { standard: 'm', decimalPlaces: 2 })} · Write ${bytesFormat(data.writeSpeedBytesPerSec, { standard: 'm', decimalPlaces: 2 })}`
          : 'Benchmark completed: Read/Write speed updated.',
        5000,
      )
      router.refresh()
    },
  })

  const detailDisk = drawers.getPayload<DiskModel>('disk') ?? null
  const activePoolId = drawers.getPayload<string>('poolDetail') ?? null
  const snapshotPoolId = drawers.getPayload<string>('snapshotManager') ?? null
  const activePool = useMemo(() => poolList.find((pool) => pool.id === activePoolId) ?? null, [poolList, activePoolId])
  const snapshotPool = useMemo(
    () => poolList.find((pool) => pool.id === snapshotPoolId) ?? null,
    [poolList, snapshotPoolId],
  )
  const benchmarkPool = useMemo(
    () => poolList.find((pool) => pool.id === storageModal.poolAction.poolId) ?? null,
    [poolList, storageModal.poolAction.poolId],
  )
  const benchmarkState = useMemo(() => {
    const poolId = storageModal.poolAction.poolId
    if (!poolId) return benchmark.createInitialBenchmarkState()
    return benchmark.benchmarkByPoolId[poolId] ?? benchmark.createInitialBenchmarkState()
  }, [benchmark, storageModal.poolAction.poolId])

  const handleNetworkStorageConnected = (storageId: string, storage?: Record<string, unknown>) => {
    changePoolSource('network', 'replace')
    upsertPool(toNetworkStoragePool(storageId, storage))
    router.refresh()
  }

  const handleAddStorage = () => {
    if (poolSource === 'local') {
      drawers.open('creator')
      return
    }

    drawers.open('networkCreator')
  }

  const handleOpenPoolFiles = (pool: StoragePoolModel) => {
    router.push(`/file/${encodeURIComponent(pool.storageId || pool.id)}`)
  }

  const handleCreateStoragePool = async (payload: Parameters<typeof storageActions.createPool>[0]) => {
    const ok = await storageActions.createPool(payload)
    if (!ok) return
    drawers.close('creator')
    storageModal.bumpCreatorSession()
  }

  const poolColumns = useMemo(
    () =>
      getStoragePoolColumns(
        (pool) => drawers.open('poolDetail', pool.id),
        storageConfirmActions.confirmDeletePool,
        (pool) => {
          storageModal.openBenchmark(pool)
          benchmark.ensurePoolState(pool.id)
        },
        (pool) => drawers.open('snapshotManager', pool.id),
        storageConfirmActions.confirmFormatPool,
      ),
    [benchmark, drawers, router, storageConfirmActions, storageModal],
  )

  return (
    <PageWrapper className="overflow-visible">
      <section className="space-y-6 pb-4">
        <StorageHeader
          poolSource={poolSource}
          onSourceClick={handlePoolSourceAnchorClick}
          onAddStorage={handleAddStorage}
        />

        <StorageContent
          source={poolSource}
          pools={poolList}
          disks={diskList}
          poolColumns={poolColumns}
          onDiskClick={(disk) => drawers.open('disk', disk)}
          onPoolOpenFiles={handleOpenPoolFiles}
        />
      </section>

      <StorageDrawers
        drawers={drawers}
        detailDisk={detailDisk}
        activePool={activePool}
        snapshotPool={snapshotPool}
        diskList={diskList}
        poolList={poolList}
        replaceCandidates={replaceCandidates}
        creatorSession={storageModal.creatorSession}
        onCreatorSessionBump={storageModal.bumpCreatorSession}
        onCreateStoragePool={handleCreateStoragePool}
        onNetworkStorageConnected={handleNetworkStorageConnected}
        onCreateSnapshot={storageConfirmActions.confirmCreateSnapshot}
        onRestoreSnapshot={storageActions.restoreSnapshot}
        onUpdateSnapshotPolicy={storageActions.updateSnapshotPolicy}
        onReplaceDisk={storageActions.replaceDisk}
      />

      <StorageModals
        storageModal={storageModal}
        benchmarkPool={benchmarkPool}
        benchmarkState={benchmarkState}
        activeBenchmarkPoolId={storageModal.poolAction.poolId}
        onBenchmarkOpenChange={storageModal.setBenchmarkOpen}
        onBenchmarkSizeChange={(size) => {
          const poolId = storageModal.poolAction.poolId
          if (poolId) benchmark.setSize(poolId, size as BenchmarkSizeGiB)
        }}
        onBenchmarkStart={() => {
          const poolId = storageModal.poolAction.poolId
          if (poolId) benchmark.start(poolId)
        }}
        onBenchmarkStop={() => {
          const poolId = storageModal.poolAction.poolId
          if (poolId) benchmark.stop(poolId)
        }}
      />
    </PageWrapper>
  )
}
