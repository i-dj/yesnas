'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Camera,
  Database,
  HardDrive,
  HeartPulse,
  RotateCcw,
} from 'lucide-react'

import { PageWrapper } from '@/components/layout/page-wrapper'
import {
  Button,
  Checkbox,
  DataTable,
  type DataTableHeader,
  EmptyState,
  Input,
  MetricStat,
  Progress,
  StatusPill,
} from '@/components/ui'
import {
  bytesFormat,
  calculateUsedPercent,
  cn,
  formatDateTime,
  formatUsagePercent,
  getProgressColorClass,
  performSort,
} from '@/lib/utils'
import type { DiskModel, StoragePoolModel, StoragePoolSnapshotModel } from '@/types/models/storage'
import { useStorageActions } from '../hooks/useStorageActions'
import { useSort } from '@/hooks/use-sort'
import { SORT_DIRECTIONS } from '@/types'
import { SnapshotPolicyControl } from './snapshot-policy-control'
import { StorageDetailList, StorageDetailSection } from './storage-detail-section'

interface StoragePoolDetailPageProps {
  initialPool: StoragePoolModel
  disks: DiskModel[]
  timeZone: string
}

const parseSnapshotWeekdays = (schedule?: string) =>
  [
    ...new Set(
      (schedule ?? '')
        .split('')
        .map(Number)
        .filter((day) => day >= 1 && day <= 7),
    ),
  ].sort()

const getMemberStatus = (device: StoragePoolModel['devices'][number]) => {
  const state = String(device.state || '').toUpperCase()
  const health = String(device.health || '').toLowerCase()
  const failed = ['failed', 'fail', 'warning', 'critical'].includes(health)

  if (state === 'OFFLINE' || failed) return { text: state || 'WARNING', color: 'danger' as const }
  if (['DEGRADED', 'REBUILDING', 'RESYNCING'].includes(state)) return { text: state, color: 'warning' as const }
  if (state === 'ONLINE') return { text: 'ONLINE', color: 'success' as const }
  return { text: state || 'UNKNOWN', color: 'neutral' as const }
}

export function StoragePoolDetailPage({ initialPool, disks, timeZone }: StoragePoolDetailPageProps) {
  const router = useRouter()
  const [pool, setPool] = useState(initialPool)
  const [autoSnapshotEnabled, setAutoSnapshotEnabled] = useState(Boolean(initialPool.autoSnapshotEnabled))
  const [autoSnapshotWeekdays, setAutoSnapshotWeekdays] = useState<number[]>(
    parseSnapshotWeekdays(initialPool.autoSnapshotSchedule),
  )
  const [snapshotPolicySubmitting, setSnapshotPolicySubmitting] = useState(false)
  const [restoreSnapshotId, setRestoreSnapshotId] = useState<string | null>(null)
  const [restorePassword, setRestorePassword] = useState('')
  const [restoreCreateBackup, setRestoreCreateBackup] = useState(true)
  const [restoreSubmitting, setRestoreSubmitting] = useState(false)
  const { sort: snapshotSort, handleSort: handleSnapshotSort } = useSort<StoragePoolSnapshotModel>(
    'createdAt',
    SORT_DIRECTIONS.DESC,
  )

  const storageActions = useStorageActions({
    onPoolUpdated: (nextPool) => {
      setPool(nextPool)
      setAutoSnapshotEnabled(Boolean(nextPool.autoSnapshotEnabled))
      setAutoSnapshotWeekdays(parseSnapshotWeekdays(nextPool.autoSnapshotSchedule))
    },
  })

  const snapshots = useMemo(
    () =>
      [...(pool.snapshots ?? [])]
        .filter((item): item is StoragePoolSnapshotModel => Boolean(item))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [pool.snapshots],
  )
  const sortedSnapshots = useMemo(
    () => (snapshotSort.dir ? performSort(snapshots, snapshotSort.key, snapshotSort.dir) : snapshots),
    [snapshotSort, snapshots],
  )

  const availableReplacementCount = useMemo(
    () =>
      disks.reduce((count, disk) => {
        if (String(disk.usage || '').toLowerCase() === 'unused') return count + 1
        return (
          count +
          (disk.partitions ?? []).filter((partition) => String(partition.usage || '').toLowerCase() === 'unused').length
        )
      }, 0),
    [disks],
  )

  const usedPercent = calculateUsedPercent(pool.usedBytes ?? 0, pool.totalBytes ?? 0)
  const healthValue = String(pool.health || 'unknown').toLowerCase()
  const healthy = healthValue === 'healthy' && (pool.kind !== 'cloud' || pool.mounted)
  const handleSnapshotWeekdaysChange = async (nextWeekdays: number[]) => {
    const previousWeekdays = autoSnapshotWeekdays
    const previousEnabled = autoSnapshotEnabled
    const nextEnabled = nextWeekdays.length > 0

    setAutoSnapshotWeekdays(nextWeekdays)
    setAutoSnapshotEnabled(nextEnabled)
    setSnapshotPolicySubmitting(true)
    try {
      const updated = await storageActions.updateSnapshotPolicy(pool, {
        autoSnapshotEnabled: nextEnabled,
        autoSnapshotWeekdays: nextWeekdays,
      })
      if (updated) return
      setAutoSnapshotWeekdays(previousWeekdays)
      setAutoSnapshotEnabled(previousEnabled)
    } catch {
      setAutoSnapshotWeekdays(previousWeekdays)
      setAutoSnapshotEnabled(previousEnabled)
    } finally {
      setSnapshotPolicySubmitting(false)
    }
  }

  const handleRestoreSnapshot = async (snapshotId: string) => {
    setRestoreSubmitting(true)
    try {
      await storageActions.restoreSnapshot(pool, snapshotId, {
        password: restorePassword.trim(),
        createBackup: restoreCreateBackup,
      })
      setRestoreSnapshotId(null)
      setRestorePassword('')
    } catch {
      // Keep the form open so the user can correct the password and retry.
    } finally {
      setRestoreSubmitting(false)
    }
  }

  const snapshotColumns = useMemo<DataTableHeader<StoragePoolSnapshotModel>[]>(
    () => [
      {
        key: 'name',
        label: 'Snapshot',
        width: '38%',
        sortable: true,
        render: (_, snapshot) => (
          <div className="min-w-0">
            <div className="app-body-text text-app-text truncate font-semibold">{snapshot.name}</div>
            {snapshot.description && (
              <div className="app-caption text-app-text-muted mt-0.5 truncate">{snapshot.description}</div>
            )}
          </div>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        width: '24%',
        sortable: true,
        render: (value) => <span className="text-app-text-muted">{formatDateTime(value, timeZone)}</span>,
      },
      {
        key: 'sizeBytes',
        label: 'Size',
        width: '16%',
        sortable: true,
        render: (value) => bytesFormat(value ?? 0, { standard: 'm', decimalPlaces: 2 }),
      },
      {
        key: 'readOnly',
        label: 'Mode',
        width: '14%',
        sortable: true,
        render: (_, snapshot) => (
          <StatusPill color="neutral" content={snapshot.isReadOnly || snapshot.readOnly ? 'Read only' : 'Writable'} />
        ),
      },
      {
        key: '__actions__',
        label: '',
        width: '7rem',
        align: 'right',
        render: (_, snapshot) => (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            icon={RotateCcw}
            onClick={() => {
              setRestoreSnapshotId((current) => (current === snapshot.id ? null : snapshot.id))
              setRestorePassword('')
            }}
          >
            Restore
          </Button>
        ),
      },
    ],
    [timeZone],
  )

  return (
    <PageWrapper className="-mx-8 overflow-y-auto px-8 pb-8">
      <header className="border-app-border/80 flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            tip="Back to storage"
            onClick={() => router.push('/storage')}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="app-page-title text-app-text truncate">{pool.name}</h1>
              <StatusPill
                icon={HeartPulse}
                color={healthy ? 'success' : 'warning'}
                content={healthy ? 'HEALTHY' : healthValue.toUpperCase()}
              />
            </div>
            <p className="app-body-text text-app-text-muted mt-1">
              {[pool.raidLevel?.toUpperCase(), pool.filesystem?.toUpperCase(), pool.dataPath]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MetricStat
            className="bg-app-surface min-w-24 px-3 py-2"
            label="RAID mode"
            value={pool.kind === 'local' ? pool.raidLevel.toUpperCase() : '-'}
          />
          <MetricStat
            className="bg-app-surface min-w-24 px-3 py-2"
            label="Members"
            value={pool.kind === 'local' ? String(pool.devices.length) : '-'}
          />
          <MetricStat
            className="bg-app-surface min-w-24 px-3 py-2"
            label="Snapshots"
            value={pool.kind === 'local' ? String(pool.snapshotCount) : '-'}
          />
          <MetricStat
            className="bg-app-surface min-w-24 px-3 py-2"
            label="Free space"
            value={bytesFormat(pool.freeBytes, { standard: 'm', decimalPlaces: 2 })}
          />
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-20 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="app-section-title text-app-text">Capacity overview</h2>
              <p className="app-caption text-app-text-muted mt-0.5">{pool.dataPath}</p>
            </div>
            <div className="text-app-text text-lg font-semibold">
              {formatUsagePercent(pool.usedBytes ?? 0, pool.totalBytes ?? 0, pool.usagePercent)}
            </div>
          </div>
          <Progress value={usedPercent} showLabel={false} className={getProgressColorClass(usedPercent)} />
          <div className="app-body-text flex flex-wrap items-center justify-between gap-2">
            <span className="text-app-text">
              {bytesFormat(pool.usedBytes, { standard: 'm', decimalPlaces: 2 })} used
            </span>
            <span className="text-app-text-muted">
              {bytesFormat(pool.totalBytes, { standard: 'm', decimalPlaces: 2 })} total
            </span>
          </div>
        </div>
        {pool.kind === 'local' && (
          <div className="ml-auto w-lg shrink-0">
            <SnapshotPolicyControl
              enabled={autoSnapshotEnabled}
              weekdays={autoSnapshotWeekdays}
              directSelection
              disabled={snapshotPolicySubmitting}
              saving={snapshotPolicySubmitting}
              onWeekdaysChange={handleSnapshotWeekdaysChange}
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        <StorageDetailSection icon={Database} title="Pool Information">
          <StorageDetailList
            columns={3}
            items={[
              { label: 'Status', value: pool.status },
              {
                label: 'Health',
                value: (
                  <span className="inline-flex items-center gap-1.5">
                    <HeartPulse className={cn('size-4', healthy ? 'text-emerald-400' : 'text-amber-400')} />
                    {healthValue}
                  </span>
                ),
              },
              { label: 'Filesystem', value: pool.filesystem },
              { label: 'Mounted', value: pool.mounted ? 'Yes' : 'No' },
              { label: 'Data profile', value: pool.dataProfile || '-' },
              { label: 'Metadata profile', value: pool.metadataProfile || '-' },
              { label: 'System profile', value: pool.systemProfile || '-' },
              {
                label: 'Read speed',
                value: (
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowDown className="size-4 text-sky-400" />
                    {pool.readSpeedBytesPerSec
                      ? `${bytesFormat(pool.readSpeedBytesPerSec, { standard: 'm', decimalPlaces: 2 })}/s`
                      : '-'}
                  </span>
                ),
              },
              {
                label: 'Write speed',
                value: (
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowUp className="size-4 text-violet-400" />
                    {pool.writeSpeedBytesPerSec
                      ? `${bytesFormat(pool.writeSpeedBytesPerSec, { standard: 'm', decimalPlaces: 2 })}/s`
                      : '-'}
                  </span>
                ),
              },
              { label: 'Created', value: formatDateTime(pool.createdAt, timeZone) },
              { label: 'Last checked', value: formatDateTime(pool.lastCheckedAt, timeZone) },
              { label: 'Mount path', value: pool.mountPath || '-', fullWidth: true },
            ]}
          />
        </StorageDetailSection>
      </div>

      {(pool.warnings ?? []).length > 0 && (
        <section className="border-app-border/80 border-b py-4">
          <div className="flex items-start gap-2 text-amber-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1">
              <div className="app-body-text font-semibold">Pool requires attention</div>
              {pool.warnings.map((warning) => (
                <p key={warning} className="app-caption text-amber-200/85">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {pool.kind === 'local' && (
        <>
          <div className="mt-8">
            <StorageDetailSection icon={HardDrive} title="RAID Members">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="app-caption text-app-text-muted">
                  {pool.devices.length} members · {availableReplacementCount} replacement candidates available
                </p>
              </div>
              <div className="grid gap-2 lg:grid-cols-2">
                {pool.devices.map((device) => {
                  const status = getMemberStatus(device)
                  return (
                    <article
                      key={device.id || device.devicePath}
                      className="border-app-border rounded-lg border px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="app-body-text text-app-text truncate font-semibold">{device.model}</div>
                          <div className="app-caption text-app-text-muted mt-0.5 truncate">
                            {device.devicePath || device.path}
                          </div>
                        </div>
                        <StatusPill color={status.color} content={status.text} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
                        {[
                          ['Serial', device.serial || '-'],
                          ['Capacity', bytesFormat(device.sizeBytes ?? 0, { standard: 'm', decimalPlaces: 0 })],
                          ['Transport', device.transport || '-'],
                          ['Health', device.health || '-'],
                        ].map(([label, value]) => (
                          <div key={label} className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-baseline gap-2">
                            <span className="app-caption text-app-text-muted">{label}</span>
                            <span
                              className="app-body-text text-app-text min-w-0 truncate font-semibold uppercase"
                              title={value}
                            >
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            </StorageDetailSection>
          </div>

          <StorageDetailSection icon={Camera} title="Snapshots" tBorder={false}>
            {snapshots.length === 0 ? (
              <EmptyState message="No snapshots found." />
            ) : (
              <>
                <DataTable
                  headers={snapshotColumns}
                  data={sortedSnapshots}
                  sortConfig={snapshotSort}
                  onSortAction={handleSnapshotSort}
                  tdClassName="px-4 py-1.5"
                  variant="default"
                />
                {restoreSnapshotId && (
                  <div className="bg-app-surface mt-3 grid gap-3 rounded-lg p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div className="space-y-2">
                      <label className="app-caption text-app-text-muted block">Administrator password</label>
                      <Input
                        type="password"
                        value={restorePassword}
                        onChange={(event) => setRestorePassword(event.target.value)}
                        placeholder="Required to restore this snapshot"
                      />
                      <Checkbox
                        label="Create a backup before restoring"
                        checked={restoreCreateBackup}
                        onChange={setRestoreCreateBackup}
                        className="px-0"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRestoreSnapshotId(null)
                          setRestorePassword('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        loading={restoreSubmitting}
                        disabled={!restorePassword.trim()}
                        onClick={() => handleRestoreSnapshot(restoreSnapshotId)}
                      >
                        Confirm Restore
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </StorageDetailSection>
        </>
      )}
    </PageWrapper>
  )
}
