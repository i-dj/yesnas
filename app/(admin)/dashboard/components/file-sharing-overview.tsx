'use client'

import { FolderOpen } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Card, MetricStat } from '@/components/ui'
import { storageApi } from '@/lib/api/storage.api'
import { clampPercent, cn, formatBytes, formatPercent } from '@/lib/utils'
import type { StoragePoolModel } from '@/types/models/storage'

const fileShareResources = [
  {
    name: '家庭共享',
    protocol: 'SMB / WebDAV',
    users: [
      { name: 'DJ', color: 'bg-sky-500' },
      { name: 'LY', color: 'bg-violet-500' },
      { name: 'QY', color: 'bg-emerald-500' },
    ],
  },
  {
    name: '媒体中心',
    protocol: 'SMB',
    users: [
      { name: 'MX', color: 'bg-amber-500' },
      { name: 'AL', color: 'bg-rose-500' },
    ],
  },
  {
    name: '远程同步',
    protocol: 'WebDAV / NFS',
    users: [
      { name: 'IP', color: 'bg-cyan-500' },
      { name: 'NAS', color: 'bg-indigo-500' },
      { name: 'TV', color: 'bg-teal-500' },
      { name: 'MB', color: 'bg-fuchsia-500' },
    ],
  },
]

export function FileSharingOverview() {
  const [storagePools, setStoragePools] = useState<StoragePoolModel[]>([])
  const [storagePoolsLoading, setStoragePoolsLoading] = useState(true)
  const [storagePoolsError, setStoragePoolsError] = useState(false)
  const storagePoolSummary = useMemo(
    () =>
      storagePools.reduce(
        (summary, pool) => ({
          healthyCount: summary.healthyCount + (getPoolHealth(pool) === 'healthy' ? 1 : 0),
        }),
        { healthyCount: 0 },
      ),
    [storagePools],
  )

  useEffect(() => {
    let disposed = false

    const fetchStoragePools = async () => {
      try {
        const nextPools = await storageApi.listSilently()

        if (!disposed) {
          setStoragePools(nextPools)
          setStoragePoolsError(false)
          setStoragePoolsLoading(false)
        }
      } catch {
        if (!disposed) {
          setStoragePoolsError(true)
          setStoragePoolsLoading(false)
        }
      }
    }

    void fetchStoragePools()
    const timer = window.setInterval(fetchStoragePools, 10000)

    return () => {
      disposed = true
      window.clearInterval(timer)
    }
  }, [])

  return (
    <section className="grid gap-3 xl:grid-cols-[0.82fr_1.18fr]">
      <Card className="overflow-hidden p-0">
        <div className="border-app-border flex items-center justify-between gap-3 border-b p-3">
          <div className="min-w-0">
            <h2 className="text-app-text text-sm font-semibold">Storage Pools</h2>
            <p className="text-app-text-muted mt-1 text-xs">
              {storagePoolsError
                ? '存储池接口暂时不可用'
                : storagePoolsLoading
                  ? '正在读取存储池'
                  : 'Existing pools and usage overview.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <MetricStat label="存储池" value={String(storagePools.length)} />
            <MetricStat label="健康" value={`${storagePoolSummary.healthyCount}/${storagePools.length}`} />
          </div>
        </div>

        <div className="p-2.5">
          {storagePools.length > 0 ? (
            <div className="grid max-h-[236px] grid-cols-2 gap-2 overflow-y-auto pr-1">
              {storagePools.map((pool) => (
                <div key={pool.id} className="bg-app-bg/70 hover:bg-app-hover/50 rounded-md p-2 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-app-text truncate text-xs font-semibold">{pool.name}</p>
                      <p className="text-app-text-muted mt-0.5 truncate text-[10px]">
                        {pool.raidLevel || pool.filesystem || pool.kind} · {pool.mounted ? '已挂载' : '未挂载'}
                      </p>
                    </div>
                    <span className={cn('shrink-0 text-[10px] font-semibold', getPoolHealthClass(pool))}>
                      {getPoolHealthLabel(pool)}
                    </span>
                  </div>
                  <div className="bg-app-hover mt-1.5 h-1 rounded-full">
                    <div
                      className={cn('h-1 rounded-full', pool.usagePercent >= 85 ? 'bg-amber-500' : 'bg-sky-500')}
                      style={{ width: `${clampPercent(pool.usagePercent)}%` }}
                    />
                  </div>
                  <div className="text-app-text-muted mt-1 flex items-center justify-between gap-2 text-[10px]">
                    <span className="truncate">
                      {formatBytes(pool.usedBytes)} of {formatBytes(pool.totalBytes)}
                    </span>
                    <span>{formatPercent(pool.usagePercent)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-app-text-muted grid min-h-31 place-items-center text-xs">
              {storagePoolsLoading ? '正在加载存储池' : storagePoolsError ? '无法读取存储池列表' : '暂无存储池'}
            </div>
          )}
        </div>
      </Card>
      <Card className="overflow-hidden p-0">
        <div className="border-app-border flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-app-text text-sm font-semibold">文件共享信息</h2>
            <p className="text-app-text-muted mt-1 text-xs">协议服务运行状态与共享目录访问概览</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <MetricStat label="共享目录" value={String(fileShareResources.length)} />
          </div>
        </div>

        <div className="overflow-x-auto p-2.5">
          <div className="grid auto-cols-[calc((100%-0.5rem)/2)] grid-flow-col gap-2">
            {fileShareResources.map((resource) => (
              <div key={resource.name} className="bg-app-bg/70 hover:bg-app-hover/50 rounded-md p-2 transition-colors">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-violet-500/10 text-violet-400">
                    <FolderOpen className="size-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-app-text truncate text-xs font-semibold">{resource.name}</p>
                    <p className="text-app-text-muted mt-0.5 truncate text-[10px]">{resource.protocol}</p>
                  </div>
                </div>
                <div className="mt-1.5 flex justify-end">
                  <AvatarStack users={resource.users} max={2} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  )
}

function AvatarStack({ users, max = 3 }: { users: Array<{ name: string; color: string }>; max?: number }) {
  const visibleUsers = users.slice(0, max)
  const hiddenCount = Math.max(users.length - visibleUsers.length, 0)

  return (
    <div className="flex -space-x-1.5">
      {visibleUsers.map((user) => (
        <span
          key={user.name}
          title={user.name}
          className={cn(
            'border-app-bg text-app-text grid size-6 place-items-center rounded-full border-2 text-[9px] font-semibold',
            user.color,
          )}
        >
          {user.name.slice(0, 2)}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="border-app-bg grid size-6 place-items-center rounded-full border-2 bg-sky-500 text-[9px] font-semibold text-white">
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}

function getPoolHealthLabel(pool: StoragePoolModel) {
  const health = getPoolHealth(pool)
  if (health === 'healthy') return '健康'
  if (health === 'warning') return '警告'
  if (health === 'error') return '异常'
  return pool.health || pool.status || '未知'
}

function getPoolHealthClass(pool: StoragePoolModel) {
  const health = getPoolHealth(pool)
  if (health === 'healthy') return 'text-emerald-500'
  if (health === 'warning') return 'text-amber-500'
  if (health === 'error') return 'text-red-500'
  return 'text-app-text-muted'
}

function getPoolHealth(pool: StoragePoolModel) {
  if (pool.health === 'healthy' || pool.status === 'healthy') return 'healthy'
  if (pool.health === 'warning' || pool.status === 'warning') return 'warning'
  if (pool.health === 'error' || pool.status === 'error') return 'error'
  return 'unknown'
}
