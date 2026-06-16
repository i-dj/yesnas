'use client'

import { useEffect, useMemo, useState } from 'react'

import { Card, MetricStat } from '@/components/ui'
import { storageApi } from '@/lib/api/storage.api'
import type { SystemStatusSnapshot } from '@/types/models/dashboard'
import type { StoragePoolModel } from '@/types/models/storage'
import { DockerCard } from './docker-card'

const placeholderShareCount = 12
const placeholderFtpOnlineUsers = 2

type FileSharingOverviewProps = {
  fileSharing?: SystemStatusSnapshot['fileSharing']
}

export function FileSharingOverview({ fileSharing }: FileSharingOverviewProps) {
  const [storagePools, setStoragePools] = useState<StoragePoolModel[]>([])
  const [storagePoolsLoading, setStoragePoolsLoading] = useState(true)
  const [storagePoolsError, setStoragePoolsError] = useState(false)
  const storagePoolSummary = useMemo(
    () =>
      storagePools.reduce(
        (summary, pool) => {
          const health = getPoolHealth(pool)
          return {
            healthyCount: summary.healthyCount + (health === 'healthy' ? 1 : 0),
            issueCount: summary.issueCount + (health === 'warning' || health === 'error' ? 1 : 0),
            mountedCount: summary.mountedCount + (pool.mounted ? 1 : 0),
          }
        },
        { healthyCount: 0, issueCount: 0, mountedCount: 0 },
      ),
    [storagePools],
  )

  useEffect(() => {
    let disposed = false
    storageApi
      .listSilently()
      .then((nextPools) => {
        if (!disposed) {
          setStoragePools(nextPools)
          setStoragePoolsError(false)
        }
      })
      .catch(() => {
        if (!disposed) setStoragePoolsError(true)
      })
      .finally(() => {
        if (!disposed) setStoragePoolsLoading(false)
      })

    return () => {
      disposed = true
    }
  }, [])

  return (
    <section className="grid items-stretch gap-3 xl:grid-cols-12">
      <Card className="flex h-full min-h-36 flex-col p-0 xl:col-span-3">
        <CardHeader
          title="Storage Pools"
          description={storagePoolsError ? '存储池接口暂时不可用' : '存储池运行状态统计'}
        >
          <MetricStat label="存储池" value={statValue(storagePools.length, storagePoolsLoading)} />
          <MetricStat label="健康" value={statValue(storagePoolSummary.healthyCount, storagePoolsLoading)} />
        </CardHeader>
        <div className="grid flex-1 grid-cols-2 gap-2 p-2.5">
          <MetricStat
            label="已挂载"
            value={statValue(storagePoolSummary.mountedCount, storagePoolsLoading)}
            variant="panel"
          />
          <MetricStat
            label="异常存储池"
            value={statValue(storagePoolSummary.issueCount, storagePoolsLoading)}
            variant="panel"
          />
        </div>
      </Card>

      <Card className="flex h-full min-h-36 flex-col p-0 xl:col-span-6">
        <CardHeader title="文件共享信息" description="共享统计与协议服务状态">
          <MetricStat label="共享目录" value={String(placeholderShareCount)} />
          <MetricStat label="在线人数" value={String(fileSharing?.onlineUsers ?? 8)} />
        </CardHeader>
        <div className="grid flex-1 grid-cols-2 gap-2 p-2.5 sm:grid-cols-4">
          <ProtocolStat name="SMB" online={fileSharing?.services.smb ?? 3} />
          <ProtocolStat name="FTP" online={placeholderFtpOnlineUsers} />
          <ProtocolStat name="NFS" online={fileSharing?.services.nfs ?? 0} />
          <ProtocolStat name="WebDAV" online={fileSharing?.services.webdav ?? 5} />
        </div>
      </Card>

      <DockerCard />
    </section>
  )
}

function CardHeader({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="border-app-border flex h-17 shrink-0 items-center justify-between gap-3 border-b p-3">
      <div className="min-w-0">
        <h2 className="text-app-text text-sm font-semibold">{title}</h2>
        <p className="text-app-text-muted mt-1 truncate text-xs">{description}</p>
      </div>
      <div className="flex shrink-0 gap-1.5">{children}</div>
    </div>
  )
}

function ProtocolStat({ name, online }: { name: string; online: number }) {
  const enabled = online > 0
  return (
    <div className="bg-app-bg flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-app-text truncate text-xs font-semibold">{name}</p>
          <span
            className={`size-1.5 shrink-0 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-app-text-muted/45'}`}
            title={enabled ? '启用' : '停用'}
          />
        </div>
        <p className="text-app-text-muted mt-1 truncate text-[12px]">
          在线人数 <span className="text-app-text font-semibold">{online}</span>
        </p>
      </div>
    </div>
  )
}

function statValue(value: number, loading: boolean) {
  return loading ? '-' : String(value)
}

function getPoolHealth(pool: StoragePoolModel) {
  if (pool.health === 'healthy' || pool.status === 'healthy') return 'healthy'
  if (pool.health === 'warning' || pool.status === 'warning') return 'warning'
  if (pool.health === 'error' || pool.status === 'error') return 'error'
  return 'unknown'
}
