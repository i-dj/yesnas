'use client'

import { Button, EmptyState, Input, StatusPill } from '@/components/ui'
import { bytesFormat, cn } from '@/lib/utils'
import { RAID_LEVELS, type RaidLevel } from '@/types/models/_constants'
import type { DiskModel } from '@/types/models/storage'
import { CheckSquare, Database, HardDrive, Layers3, Loader2, Square } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SnapshotPolicyControl } from './snapshot-policy-control'

interface StoragePoolCreatorProps {
  disks: DiskModel[]
  onSubmit: (payload: {
    name: string
    diskIds: string[]
    raidLevel: RaidLevel
    autoSnapshotEnabled: boolean
    autoSnapshotWeekdays: number[]
  }) => Promise<void>
}

interface PoolCandidateItem {
  candidateType: 'disk' | 'partition'
  eligible: boolean
  parentPath?: string
  path: string
  name: string
  kernelName?: string
  sizeBytes: number
  model?: string
  serial?: string
  transport?: string
  readOnly?: boolean
  hasChildren?: boolean
}

interface RaidPlanOption {
  level: RaidLevel
  label: string
  summary: string
  usableBytes: number
  backupRisk: 'high' | 'medium' | 'low'
  performance: string
  faultTolerance: string
}

const sumBytes = (sizes: number[]) => sizes.reduce((sum, size) => sum + size, 0)

const normalizeSizes = (sizes: number[]) => sizes.filter((v) => v > 0).sort((a, b) => a - b)

const estimateBtrfsRaid1Usable = (sizes: number[]): number => {
  const sorted = normalizeSizes(sizes)
  if (sorted.length < 2) return 0

  return Math.floor(sumBytes(sorted) / 2)
}

const estimateBtrfsRaid5Usable = (sizes: number[]): number => {
  const sorted = normalizeSizes(sizes)
  if (sorted.length < 3) return 0

  return Math.floor((sumBytes(sorted) * (sorted.length - 1)) / sorted.length)
}

const estimateBtrfsRaid10Usable = (sizes: number[]): number => {
  const sorted = normalizeSizes(sizes)
  if (sorted.length < 4) return 0

  return Math.floor(sumBytes(sorted) / 2)
}

const formatEstimatedCapacity = (bytes: number) =>
  `≈ ${bytesFormat(bytes, {
    standard: 's',
    decimalPlaces: 2,
  })}`

const toDiskCandidate = (disk: DiskModel): PoolCandidateItem => ({
  candidateType: 'disk',
  eligible: true,
  path: disk.path,
  name: disk.name,
  kernelName: disk.kernelName,
  sizeBytes: disk.sizeBytes,
  model: disk.model,
  serial: disk.serial,
  transport: disk.transport,
  readOnly: disk.readOnly,
  hasChildren: disk.hasChildren,
})

const toUnusedPartitionCandidates = (disk: DiskModel): PoolCandidateItem[] =>
  (disk.partitions ?? [])
    .filter((part) => String(part.usage || '').toLowerCase() === 'unused')
    .map((part) => ({
      candidateType: 'partition',
      eligible: true,
      parentPath: disk.path,
      path: part.path,
      name: part.name,
      kernelName: part.kernelName,
      sizeBytes: part.sizeBytes,
      model: disk.model,
      serial: disk.serial,
      transport: disk.transport,
      readOnly: part.readOnly,
      hasChildren: part.hasChildren,
    }))

const raidByCount = (count: number): RaidLevel[] => {
  if (count <= 1) return [RAID_LEVELS.SINGLE]
  if (count === 2) return [RAID_LEVELS.SINGLE, RAID_LEVELS.RAID0, RAID_LEVELS.RAID1]
  if (count === 3) return [RAID_LEVELS.SINGLE, RAID_LEVELS.RAID0, RAID_LEVELS.RAID1, RAID_LEVELS.RAID5]

  return [RAID_LEVELS.SINGLE, RAID_LEVELS.RAID0, RAID_LEVELS.RAID1, RAID_LEVELS.RAID5, RAID_LEVELS.RAID10]
}

const buildRaidOptions = (sizes: number[]): RaidPlanOption[] => {
  const count = sizes.length
  const total = sumBytes(sizes)

  const options: RaidPlanOption[] = [
    {
      level: RAID_LEVELS.SINGLE,
      label: count <= 1 ? 'Single Disk' : 'Single / JBOD',
      summary: count <= 1 ? 'Single disk, no redundancy.' : 'Combined capacity, no redundancy.',
      usableBytes: total,
      backupRisk: 'high',
      performance: 'Normal',
      faultTolerance: '0 disks',
    },
  ]

  if (count <= 1) return options

  options.push(
    {
      level: RAID_LEVELS.RAID0,
      label: 'RAID0',
      summary: 'Maximum capacity and speed, no redundancy.',
      usableBytes: total,
      backupRisk: 'high',
      performance: 'High',
      faultTolerance: '0 disks',
    },
    {
      level: RAID_LEVELS.RAID1,
      label: 'RAID1',
      summary: 'Btrfs mirror mode, stores 2 copies of data.',
      usableBytes: estimateBtrfsRaid1Usable(sizes),
      backupRisk: 'low',
      performance: 'Medium',
      faultTolerance: '1 disk',
    },
  )

  if (count >= 3) {
    options.push({
      level: RAID_LEVELS.RAID5,
      label: 'RAID5',
      summary: 'Single parity. Estimated usable capacity is total capacity multiplied by the data-disk ratio.',
      usableBytes: estimateBtrfsRaid5Usable(sizes),
      backupRisk: 'medium',
      performance: 'Medium-high',
      faultTolerance: '1 disk',
    })
  }

  if (count >= 4) {
    options.push({
      level: RAID_LEVELS.RAID10,
      label: 'RAID10',
      summary: 'Two data copies. Actual Btrfs usable capacity may be slightly lower with mixed-size disks.',
      usableBytes: estimateBtrfsRaid10Usable(sizes),
      backupRisk: 'low',
      performance: 'High',
      faultTolerance: '1 disk',
    })
  }

  return options
}

const getRecommendedRaid = (options: RaidPlanOption[], diskCount: number): RaidLevel => {
  if (options.length === 1) return RAID_LEVELS.SINGLE
  if (diskCount === 1) return RAID_LEVELS.SINGLE

  if (diskCount >= 4) {
    return options.find((item) => item.level === RAID_LEVELS.RAID10)?.level ?? options[0].level
  }

  if (diskCount === 3) {
    return options.find((item) => item.level === RAID_LEVELS.RAID5)?.level ?? options[0].level
  }

  return options.find((item) => item.level === RAID_LEVELS.RAID1)?.level ?? options[0].level
}

export function StoragePoolCreator({ disks, onSubmit }: StoragePoolCreatorProps) {
  const [poolName, setPoolName] = useState('')
  const [selectedDiskIds, setSelectedDiskIds] = useState<string[]>([])
  const [raidLevel, setRaidLevel] = useState<RaidLevel>(RAID_LEVELS.SINGLE)
  const [autoSnapshotEnabled, setAutoSnapshotEnabled] = useState(true)
  const [autoSnapshotWeekdays, setAutoSnapshotWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement | null>(null)

  const raidCandidates = useMemo<PoolCandidateItem[]>(() => {
    const candidates: PoolCandidateItem[] = []

    for (const disk of disks) {
      const diskUsage = String(disk.usage || '').toLowerCase()

      if (diskUsage === 'unused') {
        candidates.push(toDiskCandidate(disk))
        continue
      }

      if (diskUsage === 'mixed') {
        candidates.push(...toUnusedPartitionCandidates(disk))
      }
    }

    return candidates
  }, [disks])

  const selectedCandidates = useMemo(
    () => raidCandidates.filter((disk) => selectedDiskIds.includes(disk.path)),
    [raidCandidates, selectedDiskIds],
  )

  const selectedSizes = useMemo(
    () =>
      selectedCandidates
        .map((item) => item.sizeBytes ?? 0)
        .filter((value) => value > 0)
        .sort((a, b) => a - b),
    [selectedCandidates],
  )

  const raidOptions = useMemo(() => buildRaidOptions(selectedSizes), [selectedSizes])
  const availableRaids = useMemo(() => raidByCount(selectedCandidates.length), [selectedCandidates.length])

  const effectiveRaid: RaidLevel = availableRaids.includes(raidLevel)
    ? raidLevel
    : availableRaids[0] || RAID_LEVELS.SINGLE

  const recommendedRaid = getRecommendedRaid(raidOptions, selectedCandidates.length)

  const selectedRaidOption = raidOptions.find((item) => item.level === effectiveRaid)
  const selectedRaidRiskClass =
    selectedRaidOption?.backupRisk === 'low'
      ? 'text-emerald-400'
      : selectedRaidOption?.backupRisk === 'medium'
        ? 'text-amber-400'
        : 'text-red-400'
  const selectedRaidRiskLabel =
    selectedRaidOption?.backupRisk === 'low' ? 'Low' : selectedRaidOption?.backupRisk === 'medium' ? 'Medium' : 'High'

  useEffect(() => {
    if (selectedCandidates.length === 0) {
      setRaidLevel(RAID_LEVELS.SINGLE)
      return
    }

    setRaidLevel(getRecommendedRaid(raidOptions, selectedCandidates.length))
  }, [selectedCandidates.length, raidOptions])

  useEffect(() => {
    if (submitError) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [submitError])

  const toggleDisk = (id: string) => {
    setSelectedDiskIds((current) => (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]))
  }

  const maskSerial = (serial: string) => {
    const normalized = serial.trim()
    if (!normalized) return '-'
    if (normalized.length <= 4) return normalized

    return `****${normalized.slice(-4)}`
  }

  const resetFormState = () => {
    setPoolName('')
    setSelectedDiskIds([])
    setRaidLevel(RAID_LEVELS.SINGLE)
    setAutoSnapshotEnabled(true)
    setAutoSnapshotWeekdays([1, 2, 3, 4, 5, 6, 7])
    setSubmitError(null)
  }

  const canSubmit =
    selectedDiskIds.length > 0 &&
    poolName.trim().length > 0 &&
    (!autoSnapshotEnabled || autoSnapshotWeekdays.length > 0)

  const handleCreate = async () => {
    if (!canSubmit || submitting) return

    setSubmitError(null)
    setSubmitting(true)

    try {
      await onSubmit({
        name: poolName.trim(),
        diskIds: selectedDiskIds,
        raidLevel: effectiveRaid,
        autoSnapshotEnabled,
        autoSnapshotWeekdays,
      })

      resetFormState()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Create failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-10 p-4 select-text">
        <div className="space-y-3">
          <div className="text-app-text flex items-center gap-2 text-sm font-semibold uppercase">
            <Database className="text-app-text-muted size-4" />
            <span>Storage Name</span>
          </div>
          <Input
            id="storage-pool-name"
            type="text"
            value={poolName}
            onChange={(event) => setPoolName(event.target.value)}
            placeholder="e.g. pool-a"
          />
        </div>

        <div className="space-y-4">
          <div className="text-app-text flex items-center gap-2 text-sm font-semibold uppercase">
            <HardDrive className="text-app-text-muted size-4" />
            <span>
              Disks <span className="text-app-text-muted ml-1 normal-case">({selectedDiskIds.length} selected)</span>
            </span>
          </div>
          {raidCandidates.length === 0 && <EmptyState />}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {raidCandidates.map((candidate) => {
              const selected = selectedDiskIds.includes(candidate.path)
              const candidateKind = candidate.candidateType === 'partition' ? 'PARTITION' : 'DISK'
              const availableCapacity = bytesFormat(candidate.sizeBytes, { standard: 's', decimalPlaces: 2 })
              const serial = candidate.serial || '-'
              return (
                <button
                  key={candidate.path}
                  type="button"
                  onClick={() => toggleDisk(candidate.path)}
                  className={cn(
                    'border-app-border bg-app-bg hover:border-app-border-strong flex items-center justify-between rounded-lg border px-2 py-2.5 text-left select-text',
                    selected && 'border-app-border-strong bg-app-hover',
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="text-app-text w-22 shrink-0 text-base leading-none font-bold tracking-tight">
                      {availableCapacity}
                    </div>
                    <div className="min-w-0">
                      <div className="text-app-text-muted truncate text-[11px]">SN: {maskSerial(serial)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill color="neutral" content={candidateKind} />
                    {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {selectedDiskIds.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-app-text flex items-center gap-2 text-sm font-semibold uppercase">
                <Layers3 className="text-app-text-muted size-4" />
                <span>RAID Mode</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {raidOptions.map((option) => {
                const active = effectiveRaid === option.level
                const recommended = option.level === recommendedRaid
                return (
                  <button
                    key={option.level}
                    type="button"
                    onClick={() => setRaidLevel(option.level)}
                    className={cn(
                      'border-app-border hover:border-app-border-strong hover:bg-app-hover text-app-text-muted flex h-9 items-center gap-2 rounded-lg border bg-transparent px-3 text-sm transition-colors',
                      active && 'border-app-border-strong bg-app-hover text-app-text',
                    )}
                  >
                    <span
                      className={cn(
                        'border-app-border flex size-3 shrink-0 items-center justify-center rounded-full border transition-colors',
                        active && 'border-app-text',
                      )}
                    >
                      {active ? <span className="bg-app-text block size-[5px] rounded-full" /> : null}
                    </span>
                    <span>{option.level === RAID_LEVELS.SINGLE ? 'Single' : option.level.toUpperCase()}</span>
                    {recommended && (
                      <span className="bg-theme/10 text-theme rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                        Best
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedRaidOption && (
              <div className="border-app-border bg-app-hover/30 grid grid-cols-[minmax(180px,1fr)_minmax(260px,1.25fr)] gap-5 rounded-lg border px-4 py-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-app-text truncate text-base font-semibold">{selectedRaidOption.label}</span>
                    {effectiveRaid === recommendedRaid && (
                      <span className="bg-theme/10 text-theme rounded px-2 py-0.5 text-[10px] font-semibold uppercase">
                        Best
                      </span>
                    )}
                  </div>
                  <div className="text-app-text-muted mt-1 text-xs leading-5">{selectedRaidOption.summary}</div>
                </div>
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-app-text-muted text-[10px] whitespace-nowrap uppercase">Usable Capacity</span>
                    <span className="text-app-text text-sm font-semibold">
                      {formatEstimatedCapacity(selectedRaidOption.usableBytes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-app-text-muted text-[10px] whitespace-nowrap uppercase">Min. Tolerance</span>
                    <span className="text-app-text text-sm font-semibold">{selectedRaidOption.faultTolerance}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-app-text-muted text-[10px] uppercase">Perf</span>
                    <span className="text-app-text text-sm font-semibold">{selectedRaidOption.performance}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-app-text-muted text-[10px] uppercase">Risk</span>
                    <span className={cn('text-sm font-semibold', selectedRaidRiskClass)}>{selectedRaidRiskLabel}</span>
                  </div>
                </div>
              </div>
            )}
            {selectedRaidOption && (
              <div className="mt-8">
                <SnapshotPolicyControl
                  directSelection={true}
                  weekdays={autoSnapshotWeekdays}
                  onWeekdaysChange={(weekdays) => {
                    setAutoSnapshotWeekdays(weekdays)
                    setAutoSnapshotEnabled(weekdays.length > 0)
                  }}
                />
              </div>
            )}
          </div>
        )}

        {submitError && (
          <div ref={errorRef} className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-xs text-red-400">
            {submitError}
          </div>
        )}
      </div>

      <div className="border-app-border bg-app-hover mt-auto border-t px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-app-text text-sm">
              {poolName.trim() || '未命名存储池'} · {selectedDiskIds.length} 块磁盘 · {effectiveRaid.toUpperCase()} ·
              可用容量 {selectedRaidOption ? formatEstimatedCapacity(selectedRaidOption.usableBytes) : ''}
            </div>
            <div className="text-app-text-muted mt-0.5 truncate text-xs">
              {selectedRaidOption ? `${selectedRaidOption.summary}` : '选择磁盘后配置 RAID 与快照策略'}
              {autoSnapshotEnabled ? ` · 自动快照 ${autoSnapshotWeekdays.length} 天/周` : ''}
            </div>
          </div>
          <Button
            type="button"
            variant={canSubmit ? 'primary' : 'secondary'}
            disabled={!canSubmit || submitting}
            loading={submitting}
            className="min-w-28 shrink-0"
            onClick={handleCreate}
          >
            开始创建存储
          </Button>
        </div>
      </div>
    </div>
  )
}
