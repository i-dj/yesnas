'use client'

import { Button, ConfirmModal, DataTable, EmptyState, Input, SideDrawer, ToggleButton } from '@/components/ui'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { useEffect, useMemo, useState } from 'react'
import { getDiskColumns } from './_columns/DiskColumns'
import { getStoragePoolColumns } from './_columns/StoragePoolColumns'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'
import {
  createStoragePool,
  createStoragePoolSnapshot,
  deleteStoragePool,
  formatStoragePool,
  replaceStoragePoolDevice,
  restoreStoragePoolSnapshot,
} from '@/lib/server/file-service'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import type { RaidLevel } from '@/types/models/_constants'
import { toast } from '@/store/use-toast-store'
import { bytesFormat } from '@/lib/utils'
import { getErrorMessage, runWithToast } from '@/lib/run-with-toast'
import { useDrawerGroup } from '@/hooks/use-drawer-group'
import { useStorageBenchmark, type BenchmarkSizeGiB } from './_hooks/useStorageBenchmark'
import { DiskDetailDrawer, StoragePoolBenchmark, StoragePoolCreator, StoragePoolDetail } from './_components'

interface StorageClientProps {
  diskList: DiskModel[]
  storagePools: StoragePoolModel[]
}

const tabItems = [
  { value: 'all', label: '全部' },
  { value: 'used', label: '已使用' },
  { value: 'unused', label: '未使用' },
] as const

type TabValue = (typeof tabItems)[number]['value']
type DiskTableRow = DiskModel & { id: string }

const initialQuickDeleteState = {
  poolId: '',
  poolName: '',
  password: '',
  error: null as string | null,
  deleting: false,
}

const initialSnapshotPayload = {
  name: '',
  sourcePath: '',
  description: '',
  readOnly: true,
}

const initialPoolActionState = {
  poolId: null as string | null,
  modal: {
    benchmark: false,
    createSnapshot: false,
    formatPool: false,
    deletePool: false,
  },
  submitting: false,
}

export function StorageClient({ diskList, storagePools }: StorageClientProps) {
  const router = useRouter()
  const drawers = useDrawerGroup(['disk', 'creator', 'poolDetail'] as const)

  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [creatorSession, setCreatorSession] = useState(0)
  const [poolList, setPoolList] = useState<StoragePoolModel[]>(storagePools)
  const [quickDelete, setQuickDelete] = useState(initialQuickDeleteState)
  const [poolAction, setPoolAction] = useState(initialPoolActionState)
  const [snapshotPayload, setSnapshotPayload] = useState(initialSnapshotPayload)
  const [formatPassword, setFormatPassword] = useState('')

  const benchmark = useStorageBenchmark({
    onCompleted: (poolId, data) => {
      setPoolList((currentPools) =>
        currentPools.map((pool) =>
          pool.id === poolId
            ? {
                ...pool,
                readSpeedBytesPerSec: data.readSpeedBytesPerSec,
                writeSpeedBytesPerSec: data.writeSpeedBytesPerSec,
              }
            : pool,
        ),
      )
      setPoolAction((prev) => ({
        ...prev,
        modal: { ...prev.modal, benchmark: false },
      }))
      toast.success(
        'Benchmark completed',
        data.writeSpeedBytesPerSec && data.readSpeedBytesPerSec
          ? `Read ${bytesFormat(data.readSpeedBytesPerSec)} · Write ${bytesFormat(data.writeSpeedBytesPerSec)}`
          : 'Read/Write speed updated.',
        5000,
      )
      router.refresh()
    },
  })

  useEffect(() => {
    setPoolList(storagePools)
  }, [storagePools])

  const diskRows = useMemo<DiskTableRow[]>(() => {
    return diskList
      .filter((disk) => {
        if (activeTab === 'all') return true
        return activeTab === 'used' ? disk.inUse : !disk.inUse
      })
      .map((disk) => ({ ...disk, id: disk.path }))
  }, [activeTab, diskList])

  const diskStats = useMemo(() => {
    const total = diskList.length
    const available = diskList.filter((disk) => !disk.inUse).length
    const inUse = total - available
    return { total, available, inUse }
  }, [diskList])

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

  const replaceCandidates = useMemo(() => {
    const items: Array<{
      path: string
      label: string
      sizeBytes: number
      kind: 'disk' | 'partition'
    }> = []

    for (const disk of diskList) {
      const usage = String(disk.usage || '').toLowerCase()
      if (usage === 'unused') {
        items.push({
          path: disk.path,
          label: disk.model || disk.name || disk.path,
          sizeBytes: disk.sizeBytes ?? 0,
          kind: 'disk',
        })
      }
      if (usage === 'mixed') {
        for (const part of disk.partitions ?? []) {
          if (String(part.usage || '').toLowerCase() !== 'unused') continue
          items.push({
            path: part.path,
            label: `${disk.model || disk.name || disk.path} (${part.name})`,
            sizeBytes: part.sizeBytes ?? 0,
            kind: 'partition',
          })
        }
      }
    }

    return items
  }, [diskList])

  const handleOpenDiskDetail = (disk: DiskModel) => {
    drawers.open('disk', disk)
  }
  const handleOpenPoolDetail = (pool: StoragePoolModel) => {
    drawers.open('poolDetail', pool.id)
  }
  const handleOpenCreator = () => drawers.open('creator')
  const handleOpenQuickDelete = (pool: StoragePoolModel) => {
    setQuickDelete({
      poolId: pool.id,
      poolName: pool.name,
      password: '',
      error: null,
      deleting: false,
    })
    setPoolAction((prev) => ({
      ...prev,
      modal: { ...prev.modal, deletePool: true },
    }))
  }
  const handleOpenBenchmark = (pool: StoragePoolModel) => {
    setPoolAction((prev) => ({
      ...prev,
      poolId: pool.id,
      modal: { ...prev.modal, benchmark: true },
    }))
    benchmark.ensurePoolState(pool.id)
  }
  const handleOpenSnapshot = (pool: StoragePoolModel) => {
    setPoolAction((prev) => ({
      ...prev,
      poolId: pool.id,
      modal: { ...prev.modal, createSnapshot: true },
      submitting: false,
    }))
    setSnapshotPayload({
      name: `snapshot-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`,
      sourcePath: '',
      description: '',
      readOnly: true,
    })
  }
  const handleOpenFormat = (pool: StoragePoolModel) => {
    setPoolAction((prev) => ({
      ...prev,
      poolId: pool.id,
      modal: { ...prev.modal, formatPool: true },
      submitting: false,
    }))
    setFormatPassword('')
  }

  const handleRestoreSnapshot = async (
    pool: StoragePoolModel,
    snapshotId: string,
    payload: { password: string; createBackup: boolean },
  ) => {
    try {
      if (!payload.password) {
        throw new Error('Please input password')
      }
      const result = await restoreStoragePoolSnapshot(pool.id, snapshotId, {
        password: payload.password,
        createBackup: payload.createBackup,
      })
      toast.success(
        'Snapshot restored',
        result.name ? `${result.name} restored successfully.` : 'Snapshot restored successfully.',
      )
      router.refresh()
    } catch (error) {
      toast.error('Restore snapshot failed', getErrorMessage(error, 'Restore snapshot failed'), 5000)
      throw error
    }
  }

  const handleReplaceDisk = async (
    pool: StoragePoolModel,
    payload: {
      oldDevicePath: string
      newDevicePath: string
      password: string
    },
  ) => {
    if (!payload.password?.trim()) {
      toast.error('Replace disk failed', 'Password is required.')
      throw new Error('Password is required')
    }
    if (!payload.newDevicePath?.trim()) {
      toast.error('Replace disk failed', 'Please select a replacement disk.')
      throw new Error('Replacement disk is required')
    }

    const ok = await runWithToast({
      task: () =>
        replaceStoragePoolDevice(pool.id, {
          password: payload.password,
          oldDevicePath: payload.oldDevicePath,
          newDevicePath: payload.newDevicePath,
        }).then(() => undefined),
      success: {
        title: 'Disk replacement started',
        description: `${payload.oldDevicePath} -> ${payload.newDevicePath}`,
      },
      fail: {
        title: 'Replace disk failed',
        fallback: 'Replace disk failed',
      },
    })

    if (!ok) throw new Error('Replace disk failed')
    router.refresh()
  }

  const handleCreateStoragePool = async (payload: { name: string; raidLevel: RaidLevel; diskIds: string[] }) => {
    const ok = await runWithToast({
      task: () =>
        createStoragePool({
          name: payload.name,
          raidLevel: payload.raidLevel,
          paths: payload.diskIds,
        }).then(() => undefined),
      success: {
        title: 'Storage pool created',
        description: `${payload.name} is ready.`,
      },
      fail: {
        title: 'Create pool failed',
        fallback: 'Create storage pool failed',
      },
    })
    if (!ok) throw new Error('Create storage pool failed')
    drawers.close('creator')
    setCreatorSession((prev) => prev + 1)
    router.refresh()
  }

  const handleConfirmQuickDelete = async () => {
    if (quickDelete.password !== '123') {
      toast.error('Delete pool failed', 'Invalid admin password.', 5000)
      return
    }
    if (!quickDelete.poolId) return
    setQuickDelete((prev) => ({ ...prev, deleting: true, error: null }))
    const ok = await runWithToast({
      task: async () => {
        await deleteStoragePool(quickDelete.poolId)
        setPoolList((current) => current.filter((pool) => pool.id !== quickDelete.poolId))
        router.refresh()
      },
      success: {
        title: 'Storage pool deleted',
        description: `${quickDelete.poolName} has been removed.`,
      },
      fail: { title: 'Delete pool failed', fallback: 'Delete pool failed' },
    })
    if (ok) {
      setQuickDelete(initialQuickDeleteState)
      setPoolAction((prev) => ({
        ...prev,
        modal: { ...prev.modal, deletePool: false },
      }))
      return
    }
    setQuickDelete((prev) => ({
      ...prev,
      error: 'Delete pool failed',
      deleting: false,
    }))
  }

  const handleConfirmSnapshot = async () => {
    if (!benchmarkPool?.id) return
    const trimmedName = snapshotPayload.name.trim()
    if (!trimmedName) {
      toast.error('Create snapshot failed', 'Snapshot name is required.')
      return
    }

    setPoolAction((prev) => ({ ...prev, submitting: true }))
    const ok = await runWithToast({
      task: () =>
        createStoragePoolSnapshot(benchmarkPool.id, {
          name: trimmedName,
          sourcePath: snapshotPayload.sourcePath ?? '',
          description: snapshotPayload.description?.trim() ?? '',
          readOnly: snapshotPayload.readOnly ?? true,
        }).then(() => undefined),
      success: {
        title: 'Snapshot created',
        description: `${benchmarkPool.name} · ${trimmedName}`,
      },
      fail: {
        title: 'Create snapshot failed',
        fallback: 'Create snapshot failed',
      },
    })
    setPoolAction((prev) => ({ ...prev, submitting: false }))
    if (!ok) return
    setPoolAction((prev) => ({
      ...prev,
      modal: { ...prev.modal, createSnapshot: false },
    }))
    setSnapshotPayload(initialSnapshotPayload)
    router.refresh()
  }

  const handleConfirmFormat = async () => {
    if (!benchmarkPool?.id) return
    const password = formatPassword.trim()
    if (!password) {
      toast.error('Format pool failed', 'Password is required.')
      return
    }

    setPoolAction((prev) => ({ ...prev, submitting: true }))
    const ok = await runWithToast({
      task: async () => {
        const result = await formatStoragePool(benchmarkPool.id, { password })
        if (result.pool) {
          setPoolList((current) => current.map((pool) => (pool.id === result.pool?.id ? result.pool : pool)))
        }
      },
      success: {
        title: 'Pool formatted',
        description: `${benchmarkPool.name} formatted successfully.`,
      },
      fail: { title: 'Format pool failed', fallback: 'Format pool failed' },
    })
    setPoolAction((prev) => ({ ...prev, submitting: false }))
    if (!ok) return
    setPoolAction((prev) => ({
      ...prev,
      modal: { ...prev.modal, formatPool: false },
    }))
    setFormatPassword('')
    router.refresh()
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
      <section className="space-y-1.5 pb-2">
        <h2 className="text-app-text text-base font-semibold">Disks</h2>
        <p className="text-app-text-muted text-xs">
          Total devices: {diskStats.total} · Available: {diskStats.available} · In use: {diskStats.inUse}
        </p>
      </section>

      <ToggleButton
        className="gap-6 rounded-none"
        itemClassName="text-sm"
        variant="segmented"
        items={tabItems}
        value={activeTab}
        onChange={(value) => setActiveTab(value as TabValue)}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <DataTable
          showHeader={false}
          headers={diskColumns}
          data={diskRows}
          tdClassName="py-2 px-2 text-[13px]"
          variant="primary"
        />

        <section className="mt-10 space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-app-text text-base font-semibold">Storage Pools</h2>
              <p className="text-app-text-muted mt-0.5 text-xs">Existing pools and usage overview.</p>
            </div>
            <Button type="button" icon={Plus} size="sm" variant="borderghost" onClick={handleOpenCreator}>
              Add Pool
            </Button>
          </div>

          {poolList.length === 0 ? (
            <EmptyState message="No storage pools found." />
          ) : (
            <DataTable
              showHeader={false}
              headers={poolColumns}
              data={poolList}
              tdClassName="py-2 px-2 text-[13px]"
              variant="primary"
            />
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
          setCreatorSession((prev) => prev + 1)
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
        onReplaceDisk={handleReplaceDisk}
      />

      <StoragePoolBenchmark
        open={poolAction.modal.benchmark}
        pool={benchmarkPool}
        state={benchmarkState}
        onOpenChange={(open) => {
          if (!open && poolAction.poolId) {
            benchmark.stop(poolAction.poolId)
          }
          setPoolAction((prev) => ({
            ...prev,
            modal: { ...prev.modal, benchmark: open },
          }))
        }}
        onSizeChange={(size) => {
          if (!poolAction.poolId) return
          benchmark.setSize(poolAction.poolId, size as BenchmarkSizeGiB)
        }}
        onStart={() => {
          if (!poolAction.poolId) return
          benchmark.start(poolAction.poolId)
        }}
        onStop={() => {
          if (!poolAction.poolId) return
          benchmark.stop(poolAction.poolId)
        }}
      />

      <ConfirmModal
        open={poolAction.modal.deletePool}
        focusFirstInput
        onOpenChange={(open) => {
          if (!open) {
            setQuickDelete(initialQuickDeleteState)
          }
          setPoolAction((prev) => ({
            ...prev,
            modal: { ...prev.modal, deletePool: open },
          }))
        }}
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
            onChange={(event) =>
              setQuickDelete((prev) => ({
                ...prev,
                password: event.target.value,
                error: null,
              }))
            }
            placeholder="Admin password (123)"
          />
          {quickDelete.error && <p className="mt-2 text-xs text-red-400">{quickDelete.error}</p>}
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={poolAction.modal.createSnapshot}
        focusFirstInput
        onOpenChange={(open) => {
          setPoolAction((prev) => ({
            ...prev,
            submitting: open ? prev.submitting : false,
            modal: { ...prev.modal, createSnapshot: open },
          }))
          if (!open) {
            setSnapshotPayload(initialSnapshotPayload)
          }
        }}
        title="Create Snapshot"
        description={`Create snapshot for ${benchmarkPool?.name}.`}
        confirmText="Create Snapshot"
        cancelText="Cancel"
        loading={poolAction.submitting && poolAction.modal.createSnapshot}
        isDestructive={false}
        onConfirm={handleConfirmSnapshot}
      >
        <div className="mt-3 space-y-2 px-6">
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
        onOpenChange={(open) => {
          setPoolAction((prev) => ({
            ...prev,
            submitting: open ? prev.submitting : false,
            modal: { ...prev.modal, formatPool: open },
          }))
          if (!open) {
            setFormatPassword('')
          }
        }}
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
