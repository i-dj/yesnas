'use client'

import {
  Button,
  ConfirmModal,
  DataTable,
  EmptyState,
  Input,
  SideDrawer,
  ToggleButton,
} from '@/components/ui'
import { useEffect, useMemo, useState } from 'react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { getDiskColumns } from './_components/DiskColumns'
import { getStoragePoolColumns } from './_components/StoragePoolColumns'
import type { DiskModel, StoragePoolModel } from '@/types/models/storage'
import { DiskDetailDrawer } from './_components/DiskDetailDrawer'
import { StoragePoolCreator } from './_components/StoragePoolCreator'
import { StoragePoolDetail } from './_components/StoragePoolDetail'
import {
  type BenchmarkViewState,
  StoragePoolBenchmark,
} from './_components/StoragePoolBenchmark'
import { createStoragePool, deleteStoragePool } from '@/lib/server/file-service'
import { getStoragePoolBenchmarkStreamUrl } from '@/lib/file-api'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import type { RaidLevel } from '@/types/models/_constants'

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
type DrawerType = 'disk' | 'creator' | 'poolDetail' | null
type BenchmarkSizeGiB = 1 | 5 | 10 | 20 | 50
const initialQuickDeleteState = {
  open: false,
  poolId: '',
  poolName: '',
  password: '',
  error: null as string | null,
  deleting: false,
}
const createInitialBenchmarkState = (): BenchmarkViewState => ({
  running: false,
  stage: 'idle',
  sizeGiB: 5,
  percent: 0,
  totalBytes: 0,
  completedBytes: 0,
  remainingBytes: 0,

  elapsedSeconds: 0,
  currentSpeedBytesPerSec: 0,
  writeSpeedBytesPerSec: 0,
  readSpeedBytesPerSec: 0,

  error: null,
})

export function StorageClient({ diskList, storagePools }: StorageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [selectedIds] = useState<Set<string>>(new Set())
  const [detailDisk, setDetailDisk] = useState<DiskModel | null>(null)
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null)
  const [creatorSession, setCreatorSession] = useState(0)
  const [activePoolId, setActivePoolId] = useState<string | null>(null)
  const [poolList, setPoolList] = useState<StoragePoolModel[]>(storagePools)
  const [quickDelete, setQuickDelete] = useState(initialQuickDeleteState)
  const [benchmarkOpen, setBenchmarkOpen] = useState(false)
  const [benchmarkPoolId, setBenchmarkPoolId] = useState<string | null>(null)
  const [benchmarkByPoolId, setBenchmarkByPoolId] = useState<
    Record<string, BenchmarkViewState>
  >({})
  const benchmarkStreamByPoolId = useMemo(
    () => new Map<string, EventSource>(),
    [],
  )

  useEffect(() => {
    setPoolList(storagePools)
  }, [storagePools])

  useEffect(() => {
    return () => {
      benchmarkStreamByPoolId.forEach((stream) => stream.close())
      benchmarkStreamByPoolId.clear()
    }
  }, [benchmarkStreamByPoolId])

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

  const activePool = useMemo(
    () => poolList.find((pool) => pool.id === activePoolId) ?? null,
    [poolList, activePoolId],
  )
  const benchmarkPool = useMemo(
    () => poolList.find((pool) => pool.id === benchmarkPoolId) ?? null,
    [poolList, benchmarkPoolId],
  )
  const benchmarkState = useMemo(() => {
    if (!benchmarkPoolId) return createInitialBenchmarkState()
    return benchmarkByPoolId[benchmarkPoolId] ?? createInitialBenchmarkState()
  }, [benchmarkByPoolId, benchmarkPoolId])

  const handleRemovePoolById = async (poolId: string) => {
    await deleteStoragePool(poolId)
    setPoolList((current) => current.filter((pool) => pool.id !== poolId))
    router.refresh()
  }

  const handleOpenDiskDetail = (disk: DiskModel) => {
    setDetailDisk(disk)
    setActiveDrawer('disk')
  }

  const handleOpenPoolDetail = (pool: StoragePoolModel) => {
    setActivePoolId(pool.id)
    setActiveDrawer('poolDetail')
  }

  const handleOpenQuickDelete = (pool: StoragePoolModel) => {
    setQuickDelete({
      open: true,
      poolId: pool.id,
      poolName: pool.name,
      password: '',
      error: null,
      deleting: false,
    })
  }

  const handleOpenBenchmark = (pool: StoragePoolModel) => {
    setBenchmarkPoolId(pool.id)
    setBenchmarkByPoolId((prev) => ({
      ...prev,
      [pool.id]: prev[pool.id] ?? createInitialBenchmarkState(),
    }))
    setBenchmarkOpen(true)
  }

  const handleChangeBenchmarkSize = (sizeGiB: BenchmarkSizeGiB) => {
    if (!benchmarkPoolId) return
    setBenchmarkByPoolId((prev) => ({
      ...prev,
      [benchmarkPoolId]: {
        ...(prev[benchmarkPoolId] ?? createInitialBenchmarkState()),
        sizeGiB,
      },
    }))
  }

  const handleCloseBenchmarkStream = (poolId: string) => {
    const stream = benchmarkStreamByPoolId.get(poolId)
    if (stream) {
      stream.close()
      benchmarkStreamByPoolId.delete(poolId)
    }
  }

  const handleStopBenchmark = () => {
    if (!benchmarkPoolId) return
    handleCloseBenchmarkStream(benchmarkPoolId)
    setBenchmarkByPoolId((prev) => ({
      ...prev,
      [benchmarkPoolId]: {
        ...(prev[benchmarkPoolId] ?? createInitialBenchmarkState()),
        running: false,
        error: 'Benchmark stopped',
      },
    }))
  }

  const handleBenchmarkOpenChange = (open: boolean) => {
    if (!open) {
      handleStopBenchmark()
    }
    setBenchmarkOpen(open)
  }

  const handleStartBenchmark = () => {
    if (!benchmarkPoolId) return
    const poolId = benchmarkPoolId
    const current = benchmarkByPoolId[poolId] ?? createInitialBenchmarkState()

    handleCloseBenchmarkStream(poolId)
    setBenchmarkByPoolId((prev) => ({
      ...prev,
      [poolId]: {
        ...current,
        running: true,
        stage: 'ready',
        percent: 0,
        totalBytes: 0,
        completedBytes: 0,
        remainingBytes: 0,
        currentSpeedBytesPerSec: 0,
        elapsedSeconds: 0,
        readSpeedBytesPerSec: 0,
        writeSpeedBytesPerSec: 0,
        error: null,
      },
    }))

    const streamUrl = getStoragePoolBenchmarkStreamUrl(poolId, current.sizeGiB)
    const source = new EventSource(streamUrl)
    benchmarkStreamByPoolId.set(poolId, source)
    let finalized = false

    source.addEventListener('ready', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        sizeGiB?: number
      }
      setBenchmarkByPoolId((prev) => ({
        ...prev,
        [poolId]: {
          ...(prev[poolId] ?? createInitialBenchmarkState()),
          running: true,
          stage: 'ready',
          sizeGiB: (data.sizeGiB as BenchmarkSizeGiB) || current.sizeGiB,
        },
      }))
    })

    source.addEventListener('progress', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        stage?: 'write' | 'read'
        totalBytes?: number
        completedBytes?: number
        remainingBytes?: number
        percent?: number
        currentSpeedBytesPerSec?: number
        elapsedSeconds?: number
      }
      setBenchmarkByPoolId((prev) => ({
        ...prev,
        [poolId]: {
          ...(prev[poolId] ?? createInitialBenchmarkState()),
          running: true,
          stage: data.stage || 'ready',
          totalBytes: data.totalBytes ?? 0,
          completedBytes: data.completedBytes ?? 0,
          remainingBytes: data.remainingBytes ?? 0,
          percent: data.percent ?? 0,
          currentSpeedBytesPerSec: data.currentSpeedBytesPerSec ?? 0,
          elapsedSeconds: data.elapsedSeconds ?? 0,
        },
      }))
    })

    source.addEventListener('completed', (event) => {
      finalized = true
      const data = JSON.parse((event as MessageEvent).data) as {
        writeSpeedBytesPerSec?: number
        readSpeedBytesPerSec?: number
        writeSpeedHuman?: string
        readSpeedHuman?: string
      }
      setBenchmarkByPoolId((prev) => ({
        ...prev,
        [poolId]: {
          ...(prev[poolId] ?? createInitialBenchmarkState()),
          running: false,
          stage: 'completed',
          percent: 100,
          readSpeedBytesPerSec: data.readSpeedBytesPerSec ?? 0,
          writeSpeedBytesPerSec: data.writeSpeedBytesPerSec ?? 0,
        },
      }))
      setPoolList((currentPools) =>
        currentPools.map((pool) =>
          pool.id === poolId
            ? {
                ...pool,
                readSpeedBytesPerSec:
                  data.readSpeedBytesPerSec ?? pool.readSpeedBytesPerSec,
                writeSpeedBytesPerSec:
                  data.writeSpeedBytesPerSec ?? pool.writeSpeedBytesPerSec,
                readSpeedHuman:
                  data.readSpeedHuman ?? pool.readSpeedBytesPerSec,
                writeSpeedHuman:
                  data.writeSpeedHuman ?? pool.writeSpeedBytesPerSec,
              }
            : pool,
        ),
      )
      handleCloseBenchmarkStream(poolId)
      router.refresh()
    })

    source.addEventListener('error', (event) => {
      finalized = true
      const messageEvent = event as MessageEvent
      let parsed: {
        message?: string
        error?: string
        code?: string
        status?: string
      } | null = null
      let fallbackRaw = ''
      try {
        if (typeof messageEvent.data === 'string') {
          fallbackRaw = messageEvent.data
        }
        parsed =
          typeof messageEvent.data === 'string' && messageEvent.data
            ? (JSON.parse(messageEvent.data) as {
                message?: string
                error?: string
                code?: string
                status?: string
              })
            : null
      } catch {
        parsed = null
      }
      const reason =
        parsed?.message ||
        parsed?.error ||
        (parsed?.code && parsed?.status
          ? `${parsed.code}: ${parsed.status}`
          : parsed?.code) ||
        fallbackRaw ||
        'Benchmark failed'
      setBenchmarkByPoolId((prev) => ({
        ...prev,
        [poolId]: {
          ...(prev[poolId] ?? createInitialBenchmarkState()),
          running: false,
          stage: 'failed',
          error: reason,
        },
      }))
      handleCloseBenchmarkStream(poolId)
    })

    source.onerror = () => {
      if (finalized) return
      // SSE transport may temporarily disconnect; EventSource will auto-reconnect.
      setBenchmarkByPoolId((prev) => ({
        ...prev,
        [poolId]: {
          ...(prev[poolId] ?? createInitialBenchmarkState()),
          running: true,
          error: 'Benchmark stream reconnecting...',
        },
      }))
    }
  }

  const handleOpenCreator = () => {
    setActiveDrawer('creator')
  }

  const handleCreateStoragePool = async (payload: {
    name: string
    raidLevel: RaidLevel
    diskIds: string[]
  }) => {
    await createStoragePool({
      name: payload.name,
      raidLevel: payload.raidLevel,
      paths: payload.diskIds,
    })

    setActiveDrawer(null)
    setCreatorSession((prev) => prev + 1)
    router.refresh()
  }

  const handleQuickDeleteOpenChange = (open: boolean) => {
    setQuickDelete((prev) =>
      open ? { ...prev, open: true } : initialQuickDeleteState,
    )
  }

  const handleConfirmQuickDelete = async () => {
    if (quickDelete.password !== '123') {
      setQuickDelete((prev) => ({
        ...prev,
        error: 'Invalid admin password.',
      }))
      return
    }
    if (!quickDelete.poolId) return
    setQuickDelete((prev) => ({
      ...prev,
      deleting: true,
      error: null,
    }))
    try {
      await handleRemovePoolById(quickDelete.poolId)
      setQuickDelete(initialQuickDeleteState)
    } catch (error) {
      setQuickDelete((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Delete pool failed',
        deleting: false,
      }))
    }
  }

  const diskColumns = useMemo(
    () => getDiskColumns(selectedIds, handleOpenDiskDetail),
    [selectedIds],
  )

  const poolColumns = useMemo(
    () =>
      getStoragePoolColumns(
        handleOpenPoolDetail,
        handleOpenQuickDelete,
        handleOpenBenchmark,
      ),
    [],
  )

  const closeDiskDrawer = (open: boolean) => {
    if (open) {
      setActiveDrawer('disk')
      return
    }
    setActiveDrawer(null)
    setDetailDisk(null)
  }

  const closeCreatorDrawer = (open: boolean) => {
    if (open) {
      setActiveDrawer('creator')
      return
    }
    setActiveDrawer(null)
    setCreatorSession((prev) => prev + 1)
  }

  const closePoolDrawer = (open: boolean) => {
    if (open) {
      setActiveDrawer('poolDetail')
      return
    }
    setActiveDrawer(null)
    setActivePoolId(null)
  }

  return (
    <PageWrapper className="flex h-full min-h-0 flex-col">
      <section className="space-y-1.5 pb-2">
        <h2 className="text-app-text text-base font-semibold">Disks</h2>
        <p className="text-app-text-muted text-xs">
          Total devices: {diskStats.total} · Available: {diskStats.available} ·
          In use: {diskStats.inUse}
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
              <h2 className="text-app-text text-base font-semibold">
                Storage Pools
              </h2>
              <p className="text-app-text-muted mt-0.5 text-xs">
                Existing pools and usage overview.
              </p>
            </div>
            <Button
              type="button"
              icon={Plus}
              size="sm"
              variant="borderghost"
              onClick={handleOpenCreator}
            >
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
        open={activeDrawer === 'disk'}
        onOpenChange={closeDiskDrawer}
      />

      <SideDrawer
        open={activeDrawer === 'creator'}
        onOpenChange={closeCreatorDrawer}
        title="Create Storage Pool"
        onAfterOpen={() => {
          document.getElementById('storage-pool-name')?.focus()
        }}
        className="p-0"
      >
        <StoragePoolCreator
          key={creatorSession}
          disks={diskList}
          onSubmit={handleCreateStoragePool}
        />
      </SideDrawer>

      <StoragePoolDetail
        open={activeDrawer === 'poolDetail'}
        activePool={activePool}
        onOpenChange={closePoolDrawer}
      />

      <StoragePoolBenchmark
        open={benchmarkOpen}
        pool={benchmarkPool}
        state={benchmarkState}
        onOpenChange={handleBenchmarkOpenChange}
        onSizeChange={handleChangeBenchmarkSize}
        onStart={handleStartBenchmark}
        onStop={handleStopBenchmark}
      />

      <ConfirmModal
        open={quickDelete.open}
        focusFirstInput
        onOpenChange={handleQuickDeleteOpenChange}
        title="Delete Storage Pool"
        description={
          <>
            This action will permanently remove
            <strong>{quickDelete.poolName || 'this pool'}</strong>. Enter admin
            password to continue.
          </>
        }
        confirmText="Confirm Delete"
        loading={quickDelete.deleting}
        onConfirm={handleConfirmQuickDelete}
      >
        <div className="mt-3 px-6">
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
          {quickDelete.error && (
            <p className="mt-2 text-xs text-red-400">{quickDelete.error}</p>
          )}
        </div>
      </ConfirmModal>
    </PageWrapper>
  )
}
