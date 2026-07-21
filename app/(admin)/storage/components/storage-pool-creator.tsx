'use client'

import { Button, Checkbox, EmptyState, Input, RadioGroup } from '@/components/ui'
import { bytesFormat, cn } from '@/lib/utils'
import { RAID_LEVELS, type RaidLevel } from '@/types/models/_constants'
import type { DiskModel } from '@/types/models/storage'
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
  eligible: boolean
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

const getRaidRiskClass = (risk: RaidPlanOption['backupRisk']) =>
  risk === 'low' ? 'text-emerald-400' : risk === 'medium' ? 'text-amber-400' : 'text-red-400'

const getRaidRiskLabel = (risk: RaidPlanOption['backupRisk']) =>
  risk === 'low' ? 'Low' : risk === 'medium' ? 'Medium' : 'High'

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

  const updateDiskSelection = (id: string, checked: boolean) => {
    setSelectedDiskIds((current) => (checked ? [...current, id] : current.filter((v) => v !== id)))
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
      <div className="flex-1 space-y-7 p-4 pb-6 select-text">
        <div className="space-y-3">
          <div className="text-app-text text-base font-semibold">Storage Name</div>
          <Input
            id="storage-pool-name"
            type="text"
            value={poolName}
            onChange={(event) => setPoolName(event.target.value)}
            placeholder="e.g. pool-a"
          />
        </div>

        <div className="space-y-4">
          <div className="text-app-text text-base font-semibold">
            <span>
              Disks{' '}
              <span className="text-app-text-muted ml-1 text-sm font-semibold">
                ({selectedDiskIds.length} selected)
              </span>
            </span>
          </div>
          {raidCandidates.length === 0 && <EmptyState />}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {raidCandidates.map((candidate) => {
              const selected = selectedDiskIds.includes(candidate.path)
              const availableCapacity = bytesFormat(candidate.sizeBytes, { standard: 's', decimalPlaces: 2 })
              const model = candidate.model || candidate.name || candidate.path
              const serial = candidate.serial || '-'
              return (
                <Checkbox
                  key={candidate.path}
                  variant="card"
                  checked={selected}
                  onChange={(checked) => updateDiskSelection(candidate.path, checked)}
                  className="min-h-24 items-start px-4 py-3"
                  contentClassName="space-y-3"
                  markClassName="mt-0.5 size-5"
                  label={
                    <>
                      <span className="text-app-text block min-w-0 truncate text-lg leading-none font-semibold tracking-tight">
                        {availableCapacity}
                      </span>
                      <span className="block min-w-0 space-y-1 mt-3">
                        <span className="text-app-text block truncate text-sm font-medium">{model}</span>
                        <span className="text-app-text-muted block truncate text-xs">SN: {serial}</span>
                      </span>
                    </>
                  }
                />
              )
            })}
          </div>
        </div>

        {selectedDiskIds.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-app-text text-base font-semibold">RAID Mode</div>
            </div>
            <RadioGroup
              value={effectiveRaid}
              variant="card"
              options={raidOptions.map((option) => {
                const recommended = option.level === recommendedRaid
                const metrics = [
                  { label: '容量', value: formatEstimatedCapacity(option.usableBytes) },
                  { label: '容错', value: option.faultTolerance },
                  { label: '性能', value: option.performance },
                  {
                    label: '风险',
                    value: getRaidRiskLabel(option.backupRisk),
                    className: getRaidRiskClass(option.backupRisk),
                  },
                ]

                return {
                  value: option.level,
                  label: (
                    <>
                      <span className="mb-2 block min-w-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="text-app-text truncate text-sm font-semibold">{option.label}</span>
                          {recommended && (
                            <span className="bg-theme/10 text-theme rounded px-2 py-0.5 text-[10px] font-semibold uppercase">
                              Best
                            </span>
                          )}
                        </span>
                        <span className="text-app-text-muted mt-1 line-clamp-2 text-xs leading-5">
                          {option.summary}
                        </span>
                      </span>

                      <span className="bg-app-hover/35 grid min-w-0 grid-cols-2 gap-px overflow-hidden rounded-md sm:grid-cols-4">
                        {metrics.map((metric) => (
                          <span key={metric.label} className="bg-app-bg/45 min-w-0 px-3 py-2">
                            <span className="text-app-text-muted block text-xs leading-4 uppercase">
                              {metric.label}
                            </span>
                            <span className={cn('text-app-text block truncate text-sm font-medium', metric.className)}>
                              {metric.value}
                            </span>
                          </span>
                        ))}
                      </span>
                    </>
                  ),
                }
              })}
              onValueChange={setRaidLevel}
              ariaLabel="RAID Mode"
            />
            {selectedRaidOption && (
              <div className="mt-6">
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

      <div className="border-app-border bg-app-hover sticky bottom-0 z-20 mt-auto border-t px-4 py-3">
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
