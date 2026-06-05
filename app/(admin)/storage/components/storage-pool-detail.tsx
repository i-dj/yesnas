'use client'

import { Button, EmptyState, Input, Progress, SideDrawer, StatusPill } from '@/components/ui'
import {
  bytesFormat,
  calculateUsedPercent,
  cn,
  formatDateTime,
  formatUsagePercent,
  getProgressColorClass,
} from '@/lib/utils'
import type { AutoSnapshotSchedule, StoragePoolModel, StoragePoolSnapshotModel } from '@/types/models/storage'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Camera,
  HardDrive,
  HeartPulse,
  RotateCcw,
  Save,
  ShieldAlert,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface StoragePoolDetailProps {
  open: boolean
  activePool: StoragePoolModel | null
  replaceCandidates?: Array<{
    path: string
    label: string
    sizeBytes: number
    kind: 'disk' | 'partition'
  }>
  onOpenChange: (open: boolean) => void
  onRestoreSnapshot?: (
    pool: StoragePoolModel,
    snapshotId: string,
    payload: { password: string; createBackup: boolean },
  ) => Promise<void>
  onUpdateSnapshotPolicy?: (
    pool: StoragePoolModel,
    payload: {
      autoSnapshotEnabled: boolean
      autoSnapshotSchedule: AutoSnapshotSchedule
    },
  ) => Promise<boolean | void>
  onReplaceDisk?: (
    pool: StoragePoolModel,
    payload: {
      oldDevicePath: string
      newDevicePath: string
      password: string
    },
  ) => Promise<void>
}

const groupSnapshots = (items: StoragePoolSnapshotModel[]) => {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const sevenDays = 7 * oneDay
  const fourteenDays = 14 * oneDay
  const thirtyDays = 30 * oneDay

  const groups = {
    recent7Days: [] as StoragePoolSnapshotModel[],
    lastWeek: [] as StoragePoolSnapshotModel[],
    lastMonth: [] as StoragePoolSnapshotModel[],
  }

  for (const item of items) {
    const ts = item.createdAt ? new Date(item.createdAt).getTime() : NaN
    if (Number.isNaN(ts)) {
      groups.lastMonth.push(item)
      continue
    }
    const age = now - ts
    if (age <= sevenDays) {
      groups.recent7Days.push(item)
    } else if (age <= fourteenDays) {
      groups.lastWeek.push(item)
    } else if (age <= thirtyDays) {
      groups.lastMonth.push(item)
    } else {
      groups.lastMonth.push(item)
    }
  }

  return groups
}

const snapshotScheduleLabelMap: Record<AutoSnapshotSchedule, string> = {
  hourly: 'Every hour',
  daily: 'Every day',
  monthly: 'Every month',
}

const snapshotScheduleOptions = [
  { value: 'hourly', label: 'Every hour' },
  { value: 'daily', label: 'Every day' },
  { value: 'monthly', label: 'Every month' },
] as const

function getSnapshotSchedule(schedule: StoragePoolModel['autoSnapshotSchedule']): AutoSnapshotSchedule {
  return schedule === 'hourly' || schedule === 'daily' || schedule === 'monthly' ? schedule : 'daily'
}

export function StoragePoolDetail({
  open,
  activePool,
  replaceCandidates = [],
  onOpenChange,
  onRestoreSnapshot,
  onUpdateSnapshotPolicy,
  onReplaceDisk,
}: StoragePoolDetailProps) {
  const [restoreSnapshotId, setRestoreSnapshotId] = useState<string | null>(null)
  const [restorePassword, setRestorePassword] = useState('')
  const [restoreCreateBackup, setRestoreCreateBackup] = useState(true)
  const [restoreSubmitting, setRestoreSubmitting] = useState(false)
  const [replaceTargetPath, setReplaceTargetPath] = useState<string | null>(null)
  const [replaceNewPath, setReplaceNewPath] = useState('')
  const [replacePassword, setReplacePassword] = useState('')
  const [replaceSubmitting, setReplaceSubmitting] = useState(false)
  const [autoSnapshotEnabled, setAutoSnapshotEnabled] = useState(false)
  const [autoSnapshotSchedule, setAutoSnapshotSchedule] = useState<AutoSnapshotSchedule>('daily')
  const [snapshotPolicySubmitting, setSnapshotPolicySubmitting] = useState(false)

  useEffect(() => {
    if (open) return
    setRestoreSnapshotId(null)
    setRestorePassword('')
    setRestoreCreateBackup(true)
    setRestoreSubmitting(false)
    setReplaceTargetPath(null)
    setReplaceNewPath('')
    setReplacePassword('')
    setReplaceSubmitting(false)
    setSnapshotPolicySubmitting(false)
  }, [open])

  useEffect(() => {
    setRestoreSnapshotId(null)
    setRestorePassword('')
    setRestoreCreateBackup(true)
    setRestoreSubmitting(false)
    setReplaceTargetPath(null)
    setReplaceNewPath('')
    setReplacePassword('')
    setReplaceSubmitting(false)
    setSnapshotPolicySubmitting(false)
    setAutoSnapshotEnabled(Boolean(activePool?.autoSnapshotEnabled))
    setAutoSnapshotSchedule(getSnapshotSchedule(activePool?.autoSnapshotSchedule))
  }, [activePool?.autoSnapshotEnabled, activePool?.autoSnapshotSchedule, activePool?.id])

  const snapshots = (activePool?.snapshots ?? [])
    .filter((item): item is StoragePoolSnapshotModel => Boolean(item))
    .sort((a, b) => {
      const t1 = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const t2 = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return t2 - t1
    })
  const groupedSnapshots = groupSnapshots(snapshots)

  const getMemberStatus = (device: StoragePoolModel['devices'][number]) => {
    const state = String(device.state || '').toUpperCase()
    const health = String(device.health || '').toLowerCase()
    const isFailedHealth = health === 'failed' || health === 'fail' || health === 'warning' || health === 'critical'

    if (state === 'OFFLINE') {
      return { text: 'OFFLINE', color: 'danger' as const, atRisk: true }
    }
    if (state === 'DEGRADED') {
      return { text: 'DEGRADED', color: 'warning' as const, atRisk: true }
    }
    if (state === 'REBUILDING' || state === 'RESYNCING') {
      return { text: state, color: 'warning' as const, atRisk: false }
    }
    if (state === 'ONLINE') {
      if (isFailedHealth) {
        return { text: String(device.health || 'WARNING').toUpperCase(), color: 'danger' as const, atRisk: true }
      }
      if (health === 'passed' || health === 'healthy') {
        return { text: 'ONLINE', color: 'success' as const, atRisk: false }
      }
      return { text: 'ONLINE', color: 'neutral' as const, atRisk: false }
    }
    if (isFailedHealth) {
      return { text: String(device.health || 'FAILED').toUpperCase(), color: 'danger' as const, atRisk: true }
    }
    return { text: 'UNKNOWN', color: 'warning' as const, atRisk: false }
  }

  const handleConfirmRestoreSnapshot = async (snapshotId: string) => {
    if (!activePool || !onRestoreSnapshot) return
    const password = restorePassword.trim()

    try {
      setRestoreSubmitting(true)
      await onRestoreSnapshot(activePool, snapshotId, {
        password,
        createBackup: restoreCreateBackup,
      })
      setRestoreSnapshotId(null)
      setRestorePassword('')
    } catch {
      // keep form data for user to retry
    } finally {
      setRestoreSubmitting(false)
    }
  }

  const handleConfirmReplaceDisk = async () => {
    if (!activePool || !onReplaceDisk || !replaceTargetPath) return
    const password = replacePassword.trim()
    if (!password || !replaceNewPath) return

    try {
      setReplaceSubmitting(true)
      await onReplaceDisk(activePool, {
        oldDevicePath: replaceTargetPath,
        newDevicePath: replaceNewPath,
        password,
      })
      setReplaceTargetPath(null)
      setReplaceNewPath('')
      setReplacePassword('')
    } finally {
      setReplaceSubmitting(false)
    }
  }

  const handleSaveSnapshotPolicy = async () => {
    if (!activePool || !onUpdateSnapshotPolicy) return
    try {
      setSnapshotPolicySubmitting(true)
      await onUpdateSnapshotPolicy(activePool, {
        autoSnapshotEnabled,
        autoSnapshotSchedule,
      })
    } finally {
      setSnapshotPolicySubmitting(false)
    }
  }

  const snapshotPolicyDirty =
    Boolean(activePool?.autoSnapshotEnabled) !== autoSnapshotEnabled ||
    getSnapshotSchedule(activePool?.autoSnapshotSchedule) !== autoSnapshotSchedule
  const usedPercent = calculateUsedPercent(activePool?.usedBytes ?? 0, activePool?.totalBytes ?? 0)
  const warnings = [...(activePool?.warnings ?? [])]
  const cloudUnmountedWarning = '云盘账号可访问，但本地挂载未激活，SMB 或本地路径访问可能不可用。'
  if (activePool?.kind === 'cloud' && !activePool.mounted && !warnings.includes(cloudUnmountedWarning)) {
    warnings.unshift(cloudUnmountedWarning)
  }
  const healthValue =
    activePool?.kind === 'cloud' && !activePool.mounted ? 'warning' : String(activePool?.health || '-').toLowerCase()
  const healthIconClassName =
    healthValue === 'healthy' && (activePool?.kind !== 'cloud' || activePool.mounted)
      ? 'text-emerald-400'
      : healthValue === 'error'
        ? 'text-red-400'
        : 'text-amber-400'

  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} title={'Pool Details'}>
      {!activePool ? (
        <div className="text-app-text-muted text-sm">No pool selected.</div>
      ) : (
        <div className="space-y-5">
          <section className="bg-app-bg space-y-3 rounded-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-app-text truncate text-2xl leading-tight font-semibold">{activePool.name}</div>
                <div className="text-app-text-muted mt-1 text-sm uppercase">
                  {activePool.kind === 'local' && activePool.raidLevel + ' · '}
                  {activePool.filesystem}
                </div>
              </div>
              <div className="border-app-border text-app-text flex shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-center">
                <div className="text-sm leading-none font-semibold">
                  {bytesFormat(activePool.totalBytes ?? 0, {
                    standard: 's',
                    decimalPlaces: 0,
                  })}
                </div>
                <div className="text-app-text-muted mt-1 text-xs uppercase">Capacity</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Progress value={usedPercent} showLabel={false} className={getProgressColorClass(usedPercent)} />
              <div className="text-app-text-muted flex items-center justify-between text-[11px] uppercase">
                <span>
                  {bytesFormat(activePool.usedBytes ?? 0, {
                    standard: 's',
                    decimalPlaces: 2,
                  })}{' '}
                  /{' '}
                  {bytesFormat(activePool.totalBytes ?? 0, {
                    standard: 's',
                    decimalPlaces: 0,
                  })}{' '}
                  ({activePool.dataPath})
                </span>
                <span>
                  {formatUsagePercent(activePool.usedBytes ?? 0, activePool.totalBytes ?? 0, activePool.usagePercent)}
                </span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {[
              ['Status', activePool.status],
              [
                'Health',
                <span key="health" className="inline-flex items-center gap-1.5">
                  <HeartPulse className={`h-3.5 w-3.5 ${healthIconClassName}`} />
                  {healthValue.toUpperCase()}
                </span>,
              ],
              [
                'Read Speed',
                <span key="read" className="inline-flex items-center gap-1.5">
                  <ArrowDown className="h-3.5 w-3.5 text-sky-400" />
                  {activePool.readSpeedBytesPerSec
                    ? `${bytesFormat(activePool.readSpeedBytesPerSec, {
                        standard: 'm',
                        decimalPlaces: 2,
                      })}/s`
                    : '-'}
                </span>,
              ],
              [
                'Write Speed',
                <span key="write" className="inline-flex items-center gap-1.5">
                  <ArrowUp className="h-3.5 w-3.5 text-violet-400" />
                  {activePool.writeSpeedBytesPerSec
                    ? `${bytesFormat(activePool.writeSpeedBytesPerSec, {
                        standard: 'm',
                        decimalPlaces: 2,
                      })}/s`
                    : '-'}
                </span>,
              ],
              ['Created At', formatDateTime(activePool.createdAt)],
              ['Last Checked', formatDateTime(activePool.lastCheckedAt)],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-app-bg border-app-border rounded-lg border p-2.5">
                <div className="text-app-text-muted text-[11px] font-semibold uppercase">{label}</div>
                <div className="text-app-text mt-1 text-sm">{value}</div>
              </div>
            ))}
          </section>

          {warnings.length > 0 && (
            <section className="space-y-2 rounded-lg border border-amber-500/35 bg-amber-500/8 p-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase">Warnings</span>
              </div>
              <div className="space-y-1">
                {warnings.map((warning, index) => (
                  <div key={index} className="text-[12px] text-amber-200/90">
                    {warning}
                  </div>
                ))}
              </div>
            </section>
          )}

          {activePool.kind === 'local' && (
            <>
              <section className="space-y-2">
                <div className="border-app-border flex items-center justify-between gap-3 border-b pb-1">
                  <div className="flex items-center gap-1.5">
                    <Camera className="text-app-text-muted h-3.5 w-3.5" />
                    <span className="text-app-text text-xs font-semibold uppercase">Snapshot Policy</span>
                  </div>
                  <StatusPill
                    color={autoSnapshotEnabled ? 'success' : 'neutral'}
                    content={autoSnapshotEnabled ? 'AUTO' : 'MANUAL'}
                  />
                </div>

                <div className="bg-app-bg border-app-border rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-app-text text-sm font-semibold">Auto snapshot backup</div>
                      <div className="text-app-text-muted mt-0.5 text-xs">
                        {autoSnapshotEnabled
                          ? `Runs ${snapshotScheduleLabelMap[autoSnapshotSchedule].toLowerCase()}.`
                          : 'Automatic snapshots are disabled.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoSnapshotEnabled}
                      onClick={() => setAutoSnapshotEnabled((current) => !current)}
                      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                        autoSnapshotEnabled
                          ? 'border-emerald-400/40 bg-emerald-400/30'
                          : 'border-app-border bg-app-surface'
                      }`}
                    >
                      <span
                        className={`bg-app-text absolute top-1/2 size-4 -translate-y-1/2 rounded-full transition-transform ${
                          autoSnapshotEnabled ? 'left-1 translate-x-5' : 'left-1 translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-1.5">
                      {snapshotScheduleOptions.map((option) => {
                        const active = autoSnapshotSchedule === option.value

                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={!autoSnapshotEnabled || snapshotPolicySubmitting}
                            onClick={() => setAutoSnapshotSchedule(option.value)}
                            className={cn(
                              'border-app-border bg-app-surface text-app-text-muted flex h-8 items-center justify-center gap-1.5 rounded-md border px-2 text-xs transition-colors',
                              'enabled:hover:border-app-text-muted/40 enabled:hover:bg-app-hover enabled:hover:text-app-text',
                              active && autoSnapshotEnabled && 'border-app-text-muted/40 bg-app-hover text-app-text',
                              (!autoSnapshotEnabled || snapshotPolicySubmitting) && 'cursor-not-allowed opacity-45',
                            )}
                          >
                            <span
                              className={cn(
                                'border-app-border grid size-3.5 shrink-0 place-items-center rounded-full border',
                                active && autoSnapshotEnabled && 'border-app-text',
                              )}
                            >
                              {active && autoSnapshotEnabled ? (
                                <span className="bg-app-text size-1.5 rounded-full" />
                              ) : null}
                            </span>
                            <span className="truncate">{option.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    <Button
                      size="sm"
                      icon={Save}
                      className="self-end"
                      variant={snapshotPolicyDirty ? 'primary' : 'secondary'}
                      disabled={!snapshotPolicyDirty || snapshotPolicySubmitting}
                      loading={snapshotPolicySubmitting}
                      onClick={handleSaveSnapshotPolicy}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </section>
              <section className="space-y-2">
                <div className="border-app-border flex items-center gap-1.5 border-b pb-1">
                  <HardDrive className="text-app-text-muted h-3.5 w-3.5" />
                  <span className="text-app-text text-xs font-semibold uppercase">RAID Members</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {activePool.devices.map((device) => {
                    const memberStatus = getMemberStatus(device)
                    return (
                      <div key={device.id || device.devicePath} className="space-y-1">
                        <div className="bg-app-hover/25 flex items-center justify-between gap-2 rounded-md px-2 py-1.5">
                          <div className="min-w-0">
                            <div className="text-app-text truncate text-xs">{device.model}</div>
                            <div className="text-app-text-muted truncate text-[11px]">
                              SN: {device.serial} · {device.devicePath || 'N/A'}
                            </div>
                            <div className="text-app-text-muted text-[10px] uppercase">
                              {bytesFormat(device.sizeBytes ?? 0, {
                                standard: 'm',
                                decimalPlaces: 0,
                              })}
                              · {String(device.transport || '').toUpperCase()} ·{' '}
                              {(device.deviceRole || 'data').toUpperCase()}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <StatusPill color={memberStatus.color} content={memberStatus.text} />
                            {memberStatus.atRisk ? (
                              <Button
                                size="xs"
                                variant="secondary"
                                icon={ShieldAlert}
                                onClick={() => {
                                  const oldPath = device.devicePath || device.path
                                  setReplaceTargetPath((prev) => (prev === oldPath ? null : oldPath))
                                  setReplaceNewPath('')
                                  setReplacePassword('')
                                }}
                              >
                                Replace
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        {replaceTargetPath === (device.devicePath || device.path) && (
                          <div className="bg-app-bg mt-1 rounded-md p-2">
                            <div className="space-y-2">
                              <div className="text-app-text-muted text-[11px]">Select replacement disk</div>
                              {replaceCandidates.length === 0 ? (
                                <EmptyState message="No available disk for replacement." />
                              ) : (
                                <div className="grid grid-cols-1 gap-1">
                                  {replaceCandidates.map((candidate) => (
                                    <button
                                      key={candidate.path}
                                      type="button"
                                      onClick={() => setReplaceNewPath(candidate.path)}
                                      className={
                                        replaceNewPath === candidate.path
                                          ? 'border-app-border-strong bg-app-hover rounded-md border px-2 py-1 text-left'
                                          : 'border-app-border bg-app-surface rounded-md border px-2 py-1 text-left'
                                      }
                                    >
                                      <div className="text-app-text text-xs">{candidate.path}</div>
                                      <div className="text-app-text-muted text-[10px] uppercase">
                                        {candidate.label} ·{' '}
                                        {bytesFormat(candidate.sizeBytes ?? 0, {
                                          standard: 'm',
                                          decimalPlaces: 0,
                                        })}{' '}
                                        · {candidate.kind.toUpperCase()}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}

                              <Input
                                type="password"
                                value={replacePassword}
                                onChange={(event) => setReplacePassword(event.target.value)}
                                placeholder="Admin password"
                                className="h-8 text-xs"
                              />

                              <div className="flex justify-end gap-2">
                                <Button
                                  size="xs"
                                  variant="secondary"
                                  onClick={() => {
                                    setReplaceTargetPath(null)
                                    setReplaceNewPath('')
                                    setReplacePassword('')
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="xs"
                                  variant="danger"
                                  loading={replaceSubmitting}
                                  disabled={!replacePassword.trim() || !replaceNewPath || replaceSubmitting}
                                  onClick={handleConfirmReplaceDisk}
                                >
                                  Confirm Replace
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
              <section className="space-y-2">
                <div className="border-app-border flex items-center gap-1.5 border-b pb-1">
                  <Camera className="text-app-text-muted h-3.5 w-3.5" />
                  <div className="text-app-text text-xs font-semibold uppercase">Snapshots</div>
                </div>
                {snapshots.length === 0 && <EmptyState />}
                <div className="space-y-1.5">
                  {(
                    [
                      {
                        label: '最近七天',
                        items: groupedSnapshots.recent7Days,
                      },
                      { label: '上周', items: groupedSnapshots.lastWeek },
                      { label: '上个月', items: groupedSnapshots.lastMonth },
                    ] as Array<{
                      label: string
                      items: StoragePoolSnapshotModel[]
                    }>
                  ).map(({ label, items }) => {
                    const rows = items
                    if (rows.length === 0) return null
                    return (
                      <div key={label} className="space-y-1">
                        <div className="text-app-text-muted text-[11px] font-semibold uppercase">{label}</div>
                        <div className="grid grid-cols-1 gap-1">
                          {rows.map((snapshot) => (
                            <div key={snapshot.id} className="bg-app-hover/25 rounded-md px-2 py-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-app-text truncate text-xs">{snapshot.name}</div>
                                  <div className="text-app-text-muted truncate text-[10px]">
                                    {formatDateTime(snapshot.createdAt)}
                                    {snapshot.description ? ` · ${snapshot.description}` : ''}
                                  </div>
                                </div>
                                <Button
                                  size="xs"
                                  className="text-[11px]"
                                  variant="secondary"
                                  icon={RotateCcw}
                                  loading={restoreSubmitting && restoreSnapshotId === snapshot.id}
                                  onClick={() => {
                                    setRestoreSnapshotId((prev) => (prev === snapshot.id ? null : snapshot.id))
                                  }}
                                >
                                  Restore
                                </Button>
                              </div>
                              {restoreSnapshotId === snapshot.id && (
                                <div className="bg-app-bg mt-2 rounded-md p-2">
                                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                                    <Input
                                      type="password"
                                      value={restorePassword}
                                      onChange={(event) => {
                                        setRestorePassword(event.target.value)
                                      }}
                                      placeholder="Admin password"
                                      className="h-8 text-xs"
                                    />
                                    <label className="text-app-text-muted flex items-center gap-2 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={restoreCreateBackup}
                                        onChange={(event) => setRestoreCreateBackup(event.target.checked)}
                                      />
                                      Backup before restore
                                    </label>
                                  </div>

                                  <div className="mt-2 flex justify-end gap-2">
                                    <Button
                                      size="xs"
                                      className="text-[11px]"
                                      variant="secondary"
                                      onClick={() => {
                                        setRestoreSnapshotId(null)
                                        setRestorePassword('')
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="danger"
                                      className="text-[11px]"
                                      loading={restoreSubmitting && restoreSnapshotId === snapshot.id}
                                      onClick={() => handleConfirmRestoreSnapshot(snapshot.id)}
                                    >
                                      Confirm Restore
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>{' '}
            </>
          )}
        </div>
      )}
    </SideDrawer>
  )
}
