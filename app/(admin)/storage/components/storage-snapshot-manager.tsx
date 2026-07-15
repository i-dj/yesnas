'use client'

import { Button, Checkbox, EmptyState, Input, SideDrawer } from '@/components/ui'
import { formatDateTime, parseApiDate } from '@/lib/utils'
import type { StoragePoolModel, StoragePoolSnapshotModel } from '@/types/models/storage'
import { Camera, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SnapshotPolicyControl } from './snapshot-policy-control'

interface StorageSnapshotManagerProps {
  open: boolean
  activePool: StoragePoolModel | null
  onOpenChange: (open: boolean) => void
  onCreateSnapshot?: (pool: StoragePoolModel) => void
  onRestoreSnapshot?: (
    pool: StoragePoolModel,
    snapshotId: string,
    payload: { password: string; createBackup: boolean },
  ) => Promise<void>
  onUpdateSnapshotPolicy?: (
    pool: StoragePoolModel,
    payload: {
      autoSnapshotEnabled: boolean
      autoSnapshotWeekdays: number[]
    },
  ) => Promise<boolean | void>
}

const groupSnapshots = (items: StoragePoolSnapshotModel[]) => {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const sevenDays = 7 * oneDay
  const fourteenDays = 14 * oneDay

  const groups = {
    recent7Days: [] as StoragePoolSnapshotModel[],
    lastWeek: [] as StoragePoolSnapshotModel[],
    older: [] as StoragePoolSnapshotModel[],
  }

  for (const item of items) {
    const ts = item.createdAt ? parseApiDate(item.createdAt).getTime() : NaN
    if (Number.isNaN(ts)) {
      groups.older.push(item)
      continue
    }
    const age = now - ts
    if (age <= sevenDays) groups.recent7Days.push(item)
    else if (age <= fourteenDays) groups.lastWeek.push(item)
    else groups.older.push(item)
  }

  return groups
}

function parseSnapshotWeekdays(schedule?: string) {
  return [
    ...new Set(
      (schedule ?? '')
        .split('')
        .map(Number)
        .filter((day) => day >= 1 && day <= 7),
    ),
  ].sort()
}

function sameNumbers(left: number[], right: number[]) {
  const sortedLeft = [...left].sort()
  const sortedRight = [...right].sort()
  return sortedLeft.length === sortedRight.length && sortedLeft.every((value, index) => value === sortedRight[index])
}

export function StorageSnapshotManager({
  open,
  activePool,
  onOpenChange,
  onCreateSnapshot,
  onRestoreSnapshot,
  onUpdateSnapshotPolicy,
}: StorageSnapshotManagerProps) {
  const [restoreSnapshotId, setRestoreSnapshotId] = useState<string | null>(null)
  const [restorePassword, setRestorePassword] = useState('')
  const [restoreCreateBackup, setRestoreCreateBackup] = useState(true)
  const [restoreSubmitting, setRestoreSubmitting] = useState(false)
  const [autoSnapshotEnabled, setAutoSnapshotEnabled] = useState(false)
  const [autoSnapshotWeekdays, setAutoSnapshotWeekdays] = useState<number[]>([])
  const [snapshotPolicySubmitting, setSnapshotPolicySubmitting] = useState(false)

  useEffect(() => {
    if (open) return
    setRestoreSnapshotId(null)
    setRestorePassword('')
    setRestoreCreateBackup(true)
    setRestoreSubmitting(false)
    setSnapshotPolicySubmitting(false)
  }, [open])

  useEffect(() => {
    setRestoreSnapshotId(null)
    setRestorePassword('')
    setRestoreCreateBackup(true)
    setRestoreSubmitting(false)
    setSnapshotPolicySubmitting(false)
    setAutoSnapshotEnabled(Boolean(activePool?.autoSnapshotEnabled))
    setAutoSnapshotWeekdays(parseSnapshotWeekdays(activePool?.autoSnapshotSchedule))
  }, [activePool?.autoSnapshotEnabled, activePool?.autoSnapshotSchedule, activePool?.id])

  const snapshots = (activePool?.snapshots ?? [])
    .filter((item): item is StoragePoolSnapshotModel => Boolean(item))
    .sort((a, b) => {
      const t1 = a.createdAt ? parseApiDate(a.createdAt).getTime() : 0
      const t2 = b.createdAt ? parseApiDate(b.createdAt).getTime() : 0
      return t2 - t1
    })
  const groupedSnapshots = groupSnapshots(snapshots)

  const snapshotPolicyDirty =
    Boolean(activePool?.autoSnapshotEnabled) !== autoSnapshotEnabled ||
    !sameNumbers(parseSnapshotWeekdays(activePool?.autoSnapshotSchedule), autoSnapshotWeekdays)

  const handleSaveSnapshotPolicy = async () => {
    if (!activePool || !onUpdateSnapshotPolicy) return
    try {
      setSnapshotPolicySubmitting(true)
      await onUpdateSnapshotPolicy(activePool, {
        autoSnapshotEnabled,
        autoSnapshotWeekdays,
      })
    } finally {
      setSnapshotPolicySubmitting(false)
    }
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
      // keep form data for retry
    } finally {
      setRestoreSubmitting(false)
    }
  }

  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} title="快照管理">
      {!activePool ? (
        <div className="text-app-text-muted text-sm">No pool selected.</div>
      ) : (
        <div className="space-y-5">
          <section className="border-app-border flex items-start justify-between gap-3 border-b pb-4">
            <div className="min-w-0">
              <div className="text-app-text text-2xl font-semibold">{activePool.name}</div>
              <div className="text-app-text-muted mt-1 text-sm">
                {activePool.snapshotCount ?? snapshots.length} snapshots · {activePool.raidLevel} · {activePool.filesystem}
              </div>
            </div>
            <Button size="sm" icon={Camera} onClick={() => onCreateSnapshot?.(activePool)}>
              Create Snapshot
            </Button>
          </section>

          <SnapshotPolicyControl
            weekdays={autoSnapshotWeekdays}
            directSelection
            dirty={snapshotPolicyDirty}
            disabled={snapshotPolicySubmitting}
            saving={snapshotPolicySubmitting}
            onWeekdaysChange={(weekdays) => {
              setAutoSnapshotWeekdays(weekdays)
              setAutoSnapshotEnabled(weekdays.length > 0)
            }}
            onSave={handleSaveSnapshotPolicy}
          />

          <section className="space-y-3">
            <div className="border-app-border flex items-center gap-1.5 border-b pb-1">
              <Camera className="text-app-text-muted h-4 w-4" />
              <div className="text-app-text text-sm font-semibold uppercase">Snapshots</div>
            </div>

            {snapshots.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {(
                  [
                    { label: '最近七天', items: groupedSnapshots.recent7Days },
                    { label: '上周', items: groupedSnapshots.lastWeek },
                    { label: '更早', items: groupedSnapshots.older },
                  ] as Array<{ label: string; items: StoragePoolSnapshotModel[] }>
                ).map(({ label, items }) => {
                  if (items.length === 0) return null
                  return (
                    <div key={label} className="space-y-1.5">
                      <div className="text-app-text-muted text-xs font-semibold uppercase">{label}</div>
                      <div className="grid grid-cols-1 gap-1">
                        {items.map((snapshot) => (
                          <div key={snapshot.id} className="bg-app-hover/25 rounded-md px-2 py-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-app-text truncate text-[13px]">{snapshot.name}</div>
                                <div className="text-app-text-muted truncate text-xs">
                                  {formatDateTime(snapshot.createdAt)}
                                  {snapshot.description ? ` · ${snapshot.description}` : ''}
                                </div>
                              </div>
                              <Button
                                size="xs"
                                className="text-xs"
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
                                  />
                                  <Checkbox
                                    label="Backup before restore"
                                    checked={restoreCreateBackup}
                                    onChange={setRestoreCreateBackup}
                                    className="px-0"
                                  />
                                </div>

                                <div className="mt-2 flex justify-end gap-2">
                                  <Button
                                    size="xs"
                                    className="text-sm"
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
                                    className="text-sm"
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
            )}
          </section>
        </div>
      )}
    </SideDrawer>
  )
}
