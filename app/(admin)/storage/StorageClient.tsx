'use client'

import {
  Button,
  ConfirmModal,
  DataTable,
  EmptyState,
  Input,
  SectionTitle,
  SideDrawer,
  ToggleButton,
} from '@/components/ui'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { useMemo } from 'react'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from '@/store/use-toast-store'
import { bytesFormat } from '@/lib/utils'
import { useDrawerGroup } from '@/hooks/use-drawer-group'
import { useStorageBenchmark, type BenchmarkSizeGiB } from './hooks/useStorageBenchmark'
import { useStorageActions } from './hooks/useStorageActions'
import { useStorageModal } from './hooks/useStorageModal'
import { storageTabItems, useStorageTable } from './hooks/useStorageTable'
import {
  getStoragePoolColumns,
  getDiskColumns,
  DiskDetailDrawer,
  StoragePoolDetail,
  StoragePoolCreator,
  StoragePoolBenchmark,
} from './components'

interface StorageClientProps {
  diskList: DiskModel[]
  storagePools: StoragePoolModel[]
}

export function StorageClient({ diskList, storagePools }: StorageClientProps) {
  const router = useRouter()
  const drawers = useDrawerGroup(['disk', 'creator', 'poolDetail'] as const)
  const {
    activeTab,
    setActiveTab,
    diskRows,
    diskStats,
    poolList,
    replaceCandidates,
    removePool,
    updatePool,
    updatePoolBenchmark,
  } = useStorageTable({ diskList, storagePools })
  const storageModal = useStorageModal()
  const {
    creatorSession,
    bumpCreatorSession,
    quickDelete,
    setDeleteOpen,
    setDeletePassword,
    setDeleting,
    poolAction,
    snapshotPayload,
    setSnapshotPayload,
    formatPassword,
    setFormatPassword,
  } = storageModal
  const storageActions = useStorageActions({
    onPoolDeleted: removePool,
    onPoolFormatted: updatePool,
    onPoolUpdated: updatePool,
  })

  const benchmark = useStorageBenchmark({
    onCompleted: (poolId, data) => {
      updatePoolBenchmark(poolId, data)
      storageModal.setBenchmarkOpen(false)
      toast.success(
        data.writeSpeedBytesPerSec && data.readSpeedBytesPerSec
          ? `Benchmark completed: Read ${bytesFormat(data.readSpeedBytesPerSec)} · Write ${bytesFormat(data.writeSpeedBytesPerSec)}`
          : 'Benchmark completed: Read/Write speed updated.',
        5000,
      )
      router.refresh()
    },
  })

  const detailDisk = drawers.getPayload<DiskModel>('disk') ?? null
  const activePoolId = drawers.getPayload<string>('poolDetail') ?? null
  const activePool = useMemo(() => poolList.find((pool) => pool.id === activePoolId) ?? null, [poolList, activePoolId])
  const benchmarkPool = useMemo(
    () => poolList.find((pool) => pool.id === poolAction.poolId) ?? null,
    [poolList, poolAction.poolId],
  )
  const benchmarkState = useMemo(() => {
    if (!poolAction.poolId) return benchmark.createInitialBenchmarkState()
    return benchmark.benchmarkByPoolId[poolAction.poolId] ?? benchmark.createInitialBenchmarkState()
  }, [benchmark, poolAction.poolId])
  const activeBenchmarkPoolId = poolAction.poolId

  const handleOpenDiskDetail = (disk: DiskModel) => {
    drawers.open('disk', disk)
  }
  const handleOpenPoolDetail = (pool: StoragePoolModel) => {
    drawers.open('poolDetail', pool.id)
  }
  const handleOpenCreator = () => drawers.open('creator')
  const handleOpenQuickDelete = storageModal.openDelete
  const handleOpenBenchmark = (pool: StoragePoolModel) => {
    storageModal.openBenchmark(pool)
    benchmark.ensurePoolState(pool.id)
  }
  const handleOpenSnapshot = storageModal.openSnapshot
  const handleOpenFormat = storageModal.openFormat

  const handleRestoreSnapshot = storageActions.restoreSnapshot
  const handleUpdateSnapshotPolicy = storageActions.updateSnapshotPolicy
  const handleReplaceDisk = storageActions.replaceDisk
  const handleCreateStoragePool = async (payload: Parameters<typeof storageActions.createPool>[0]) => {
    const ok = await storageActions.createPool(payload)
    if (!ok) return
    drawers.close('creator')
    bumpCreatorSession()
  }

  const handleConfirmQuickDelete = async () => {
    if (quickDelete.password !== '123') {
      toast.error('Delete pool failed: Invalid admin password.', 5000)
      return
    }
    setDeleting(true)
    const ok = await storageActions.deletePool(quickDelete.poolId, quickDelete.poolName)
    if (ok) {
      storageModal.closeDelete()
      return
    }
    setDeleting(false, 'Delete pool failed')
  }

  const handleConfirmSnapshot = async () => {
    if (!benchmarkPool) return

    storageModal.setSubmitting(true)
    const ok = await storageActions.createSnapshot(benchmarkPool, snapshotPayload)
    storageModal.setSubmitting(false)
    if (!ok) return
    storageModal.setSnapshotOpen(false)
  }

  const handleConfirmFormat = async () => {
    if (!benchmarkPool) return

    storageModal.setSubmitting(true)
    const ok = await storageActions.formatPool(benchmarkPool, formatPassword)
    storageModal.setSubmitting(false)
    if (!ok) return
    storageModal.setFormatOpen(false)
  }

  const selectedIds = useMemo(() => new Set<string>(), [])
  const diskColumns = useMemo(() => getDiskColumns(selectedIds, handleOpenDiskDetail), [selectedIds])
  const poolColumns = useMemo(
    () =>
      getStoragePoolColumns(
        handleOpenPoolDetail,
        handleOpenQuickDelete,
        handleOpenBenchmark,
        handleOpenSnapshot,
        handleOpenFormat,
      ),
    [],
  )

  return (
    <PageWrapper className="flex h-full min-h-0 flex-col">
      <SectionTitle
        title="Disks"
        subTitle={`Total devices: ${diskStats.total} · Available: ${diskStats.available} · In use: ${diskStats.inUse}`}
      />

      <ToggleButton
        className="gap-6 rounded-none"
        itemClassName="text-sm"
        variant="segmented"
        items={storageTabItems}
        value={activeTab}
        onChange={(value) => setActiveTab(value as typeof activeTab)}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <DataTable showHeader={false} headers={diskColumns} data={diskRows} variant="primary" />

        <section className="mt-10 space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <SectionTitle title="Storage Pools" subTitle={`Existing pools and usage overview.`} />
            <Button type="button" icon={Plus} size="sm" variant="borderghost" onClick={handleOpenCreator}>
              Add Pool
            </Button>
          </div>

          {poolList.length === 0 ? (
            <EmptyState message="No storage pools found." />
          ) : (
            <DataTable showHeader={false} headers={poolColumns} data={poolList} variant="primary" />
          )}
        </section>
      </div>

      <DiskDetailDrawer
        disk={detailDisk}
        storagePools={poolList}
        open={drawers.activeKey === 'disk'}
        onOpenChange={(open) => {
          if (open) {
            drawers.open('disk')
            return
          }
          drawers.close('disk')
          drawers.clearPayload('disk')
        }}
      />

      <SideDrawer
        open={drawers.activeKey === 'creator'}
        onOpenChange={(open) => {
          if (open) {
            drawers.open('creator')
            return
          }
          drawers.close('creator')
          bumpCreatorSession()
        }}
        title="Create Storage Pool"
        onAfterOpen={() => {
          document.getElementById('storage-pool-name')?.focus()
        }}
        className="p-0"
      >
        <StoragePoolCreator key={creatorSession} disks={diskList} onSubmit={handleCreateStoragePool} />
      </SideDrawer>

      <StoragePoolDetail
        open={drawers.activeKey === 'poolDetail'}
        activePool={activePool}
        replaceCandidates={replaceCandidates}
        onOpenChange={(open) => {
          if (open) {
            drawers.open('poolDetail')
            return
          }
          drawers.close('poolDetail')
          drawers.clearPayload('poolDetail')
        }}
        onRestoreSnapshot={handleRestoreSnapshot}
        onUpdateSnapshotPolicy={handleUpdateSnapshotPolicy}
        onReplaceDisk={handleReplaceDisk}
      />

      <StoragePoolBenchmark
        open={poolAction.modal.benchmark}
        pool={benchmarkPool}
        state={benchmarkState}
        onOpenChange={(open) => {
          if (!open && activeBenchmarkPoolId) {
            benchmark.stop(activeBenchmarkPoolId)
          }
          storageModal.setBenchmarkOpen(open)
        }}
        onSizeChange={(size) => {
          if (activeBenchmarkPoolId) benchmark.setSize(activeBenchmarkPoolId, size as BenchmarkSizeGiB)
        }}
        onStart={() => {
          if (activeBenchmarkPoolId) benchmark.start(activeBenchmarkPoolId)
        }}
        onStop={() => {
          if (activeBenchmarkPoolId) benchmark.stop(activeBenchmarkPoolId)
        }}
      />

      <ConfirmModal
        open={poolAction.modal.deletePool}
        focusFirstInput
        onOpenChange={setDeleteOpen}
        title="Delete Storage Pool"
        description={
          <>
            This action will permanently remove
            <strong className="px-2 text-red-400">{quickDelete.poolName}</strong>, Enter admin password to continue.
          </>
        }
        confirmText="Confirm Delete"
        loading={quickDelete.deleting}
        onConfirm={handleConfirmQuickDelete}
      >
        <div className="px-6">
          <Input
            type="password"
            value={quickDelete.password}
            onChange={(event) => setDeletePassword(event.target.value)}
            placeholder="Admin password (123)"
          />
          {quickDelete.error && <p className="mt-2 text-xs text-red-400">{quickDelete.error}</p>}
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={poolAction.modal.createSnapshot}
        focusFirstInput
        onOpenChange={storageModal.setSnapshotOpen}
        title="Create Snapshot"
        description={`Create snapshot for ${benchmarkPool?.name}.`}
        confirmText="Create Snapshot"
        cancelText="Cancel"
        loading={poolAction.submitting && poolAction.modal.createSnapshot}
        isDestructive={false}
        onConfirm={handleConfirmSnapshot}
      >
        <div className="space-y-2 px-6">
          <Input
            value={snapshotPayload.name}
            onChange={(event) =>
              setSnapshotPayload((prev) => ({
                ...prev,
                name: event.target.value,
              }))
            }
            placeholder="Snapshot name"
          />
          <Input
            value={snapshotPayload.description ?? ''}
            onChange={(event) =>
              setSnapshotPayload((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            placeholder="Description (optional)"
          />
          <label className="text-app-text-muted flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={snapshotPayload.readOnly ?? true}
              onChange={(event) =>
                setSnapshotPayload((prev) => ({
                  ...prev,
                  readOnly: event.target.checked,
                }))
              }
            />
            Read only
          </label>
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={poolAction.modal.formatPool}
        focusFirstInput
        onOpenChange={storageModal.setFormatOpen}
        title="Format Storage Pool"
        description={
          <>
            This action will format
            <strong className="px-2 text-red-400">{benchmarkPool?.name}</strong>, Enter admin password to continue.
          </>
        }
        confirmText="Format Pool"
        cancelText="Cancel"
        loading={poolAction.submitting && poolAction.modal.formatPool}
        onConfirm={handleConfirmFormat}
      >
        <div className="px-6">
          <Input
            type="password"
            value={formatPassword}
            onChange={(event) => setFormatPassword(event.target.value)}
            placeholder="Admin password"
          />
        </div>
      </ConfirmModal>
    </PageWrapper>
  )
}
