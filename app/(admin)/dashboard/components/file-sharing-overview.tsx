'use client'

import { CircleAlert, Database, FolderTree, HardDrive, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Card, InlineStat } from '@/components/ui'
import { storageApi } from '@/lib/api/storage.api'
import { resolveHealthState } from '@/lib/health'
import { cn, formatStatValue } from '@/lib/utils'
import type { SystemStatusSnapshot } from '@/types/models/dashboard'
import type { StoragePoolModel } from '@/types/models/storage'
import { DockerCard } from './docker-card'
import { OverviewCardHeader } from './overview-card-header'

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
          const health = resolveHealthState(pool.health, pool.status)
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
      <Card className="flex min-h-44 flex-col overflow-hidden p-0 xl:col-span-3">
        <OverviewCardHeader
          icon={Database}
          title="存储池"
          tone={storagePoolsError ? 'warning' : 'neutral'}
        >
          <InlineStat label="存储池" value={formatStatValue(storagePools.length, storagePoolsLoading)} />
          <InlineStat
            label="健康"
            value={formatStatValue(storagePoolSummary.healthyCount, storagePoolsLoading)}
            divided
          />
        </OverviewCardHeader>

        <div className="grid flex-1 grid-cols-2">
          <DetailMetric
            icon={HardDrive}
            label="已挂载"
            value={formatStatValue(storagePoolSummary.mountedCount, storagePoolsLoading)}
          />
          <DetailMetric
            icon={CircleAlert}
            label="异常"
            value={formatStatValue(storagePoolSummary.issueCount, storagePoolsLoading)}
            tone={storagePoolSummary.issueCount > 0 ? 'warning' : 'success'}
            divided
          />
        </div>
      </Card>

      <Card className="flex min-h-44 flex-col overflow-hidden p-0 xl:col-span-6">
        <OverviewCardHeader icon={FolderTree} title="文件共享">
          <InlineStat label="共享目录" value={String(placeholderShareCount)} />
          <InlineStat label="在线用户" value={String(fileSharing?.onlineUsers ?? 8)} divided />
        </OverviewCardHeader>

        <div className="grid flex-1 grid-cols-2 sm:grid-cols-4">
          <ProtocolStat name="SMB" online={fileSharing?.services.smb ?? 3} />
          <ProtocolStat name="FTP" online={placeholderFtpOnlineUsers} divided />
          <ProtocolStat name="NFS" online={fileSharing?.services.nfs ?? 0} dividedOnDesktop topOnMobile />
          <ProtocolStat name="WebDAV" online={fileSharing?.services.webdav ?? 5} divided topOnMobile />
        </div>
      </Card>

      <DockerCard />
    </section>
  )
}

function DetailMetric({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
  divided = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone?: 'neutral' | 'success' | 'warning'
  divided?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-4', divided && 'border-app-border border-l')}>
      <span
        className={cn(
          'grid size-5 shrink-0 place-items-center',
          tone === 'success' && 'text-emerald-500',
          tone === 'warning' && 'text-amber-500',
          tone === 'neutral' && 'text-app-text-muted',
        )}
      >
        <Icon className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <div className="text-app-text text-lg leading-none font-semibold">{value}</div>
        <div className="text-app-text-muted mt-1.5 truncate text-xs">{label}</div>
      </div>
    </div>
  )
}

function ProtocolStat({
  name,
  online,
  divided = false,
  dividedOnDesktop = false,
  topOnMobile = false,
}: {
  name: string
  online: number
  divided?: boolean
  dividedOnDesktop?: boolean
  topOnMobile?: boolean
}) {
  const enabled = online > 0

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col justify-center px-4 py-4',
        divided && 'border-app-border border-l',
        dividedOnDesktop && 'border-app-border sm:border-l',
        topOnMobile && 'max-sm:border-app-border max-sm:border-t',
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('size-1.5 rounded-full', enabled ? 'bg-emerald-500' : 'bg-app-text-muted/35')} />
        <span className="text-app-text text-xs font-semibold">{name}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-app-text text-lg leading-none font-semibold">{online}</span>
        <span className="text-app-text-muted text-[11px]">在线</span>
      </div>
      <div className={cn('mt-2 text-[11px]', enabled ? 'text-emerald-500' : 'text-app-text-muted')}>
        {enabled ? '服务正常' : '暂无连接'}
      </div>
    </div>
  )
}
