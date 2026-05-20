'use client'

import { Button, EmptyState, Input, StatusPill } from '@/components/ui'
import { bytesFormat, cn } from '@/lib/utils'
import { RAID_LEVELS, type RaidLevel } from '@/types/models/_constants'
import type { DiskModel } from '@/types/models/storage'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckSquare, Loader2, Square } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface StoragePoolCreatorProps {
  disks: DiskModel[]
  onSubmit: (payload: {
    name: string
    diskIds: string[]
    raidLevel: RaidLevel
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
      size: part.size,
      sizeBytes: part.sizeBytes,
      model: disk.model,
      serial: disk.serial,
      transport: disk.transport,
      readOnly: part.readOnly,
      hasChildren: part.hasChildren,
    }))

interface RaidPlanOption {
  level: RaidLevel
  label: string
  summary: string
  usableBytes: number
  backupRisk: 'high' | 'medium' | 'low'
  readScore: number
  writeScore: number
  performance: string
  faultTolerance: string
}

const raidByCount = (count: number): RaidLevel[] => {
  if (count <= 1) return [RAID_LEVELS.SINGLE]
  if (count === 2)
    return [RAID_LEVELS.SINGLE, RAID_LEVELS.RAID0, RAID_LEVELS.RAID1]
  if (count === 3)
    return [
      RAID_LEVELS.SINGLE,
      RAID_LEVELS.RAID0,
      RAID_LEVELS.RAID1,
      RAID_LEVELS.RAID5,
    ]
  return [
    RAID_LEVELS.SINGLE,
    RAID_LEVELS.RAID0,
    RAID_LEVELS.RAID1,
    RAID_LEVELS.RAID5,
    RAID_LEVELS.RAID10,
  ]
}

const estimateBtrfsRaid1Usable = (sizes: number[]): number => {
  if (sizes.length <= 1) return 0
  const total = sizes.reduce((sum, size) => sum + size, 0)
  const max = Math.max(...sizes)
  // Btrfs RAID1 stores 2 copies on different devices.
  // Uneven disks can use more than min-size mirror, but still constrained by placement.
  return Math.max(0, Math.min(total / 2, total - max))
}

const estimateBtrfsRaid5Usable = (sizes: number[]): number => {
  const count = sizes.length
  if (count < 3) return 0
  const total = sizes.reduce((sum, size) => sum + size, 0)
  // Btrfs "estimated free" style for parity profile: total / data_ratio,
  // data_ratio for RAID5 ~= n/(n-1) => usable ~= total * (n-1)/n
  return Math.max(0, Math.floor((total * (count - 1)) / count))
}

const buildRaidOptions = (sizes: number[]): RaidPlanOption[] => {
  const count = sizes.length
  const total = sizes.reduce((sum, size) => sum + size, 0)
  const raid1Usable = estimateBtrfsRaid1Usable(sizes)
  const raid5Usable = estimateBtrfsRaid5Usable(sizes)
  const jbodLabel = count <= 1 ? 'Single Disk' : 'Single Disk (JBOD)'
  const makeOption = (
    option: RaidPlanOption & { usableBytes: number },
  ): RaidPlanOption => option

  const noRedundancy = {
    backupRisk: 'high' as const,
    faultTolerance: '0 disks',
  }
  const mirrorRedundancy = {
    backupRisk: 'low' as const,
    faultTolerance: '1 disk',
  }
  const parityRedundancy = {
    backupRisk: 'medium' as const,
    faultTolerance: '1 disk',
  }

  const options: RaidPlanOption[] = [
    makeOption({
      level: RAID_LEVELS.SINGLE,
      label: jbodLabel,
      summary:
        count <= 1
          ? 'Single-disk mode (no redundancy)'
          : 'Concatenated capacity, no striping',
      usableBytes: total,
      readScore: 30,
      writeScore: 30,
      performance: 'Read/Write: baseline',
      ...noRedundancy,
    }),
  ]

  if (count <= 1) {
    return options
  }

  options.push(
    makeOption({
      level: RAID_LEVELS.RAID0,
      label: 'RAID0',
      summary: 'Max performance, no redundancy',
      usableBytes: total,
      readScore: 90,
      writeScore: 90,
      performance: 'Read: high · Write: high',
      ...noRedundancy,
    }),
    makeOption({
      level: RAID_LEVELS.RAID1,
      label: 'RAID1',
      summary: 'Mirror protection (Btrfs flexible mirror allocation)',
      usableBytes: raid1Usable,
      readScore: 70,
      writeScore: 55,
      performance: 'Read: medium-high · Write: medium',
      ...mirrorRedundancy,
    }),
  )
  if (count >= 3) {
    options.push(
      makeOption({
        level: RAID_LEVELS.RAID5,
        label: 'RAID5',
        summary: 'Balanced capacity and safety (Btrfs estimated)',
        usableBytes: raid5Usable,
        readScore: 80,
        writeScore: 60,
        performance: 'Read: high · Write: medium',
        ...parityRedundancy,
      }),
    )
  }
  if (count >= 4) {
    options.push(
      makeOption({
        level: RAID_LEVELS.RAID10,
        label: 'RAID10',
        summary: 'High performance + high protection',
        usableBytes: Math.floor(total / 2),
        readScore: 88,
        writeScore: 80,
        performance: 'Read: high · Write: high',
        ...mirrorRedundancy,
        faultTolerance: '>=1 disk (mirror-pair dependent)',
      }),
    )
  }
  return options
}

const getRecommendedRaid = (
  options: RaidPlanOption[],
  diskCount: number,
): RaidLevel => {
  if (options.length === 1) return RAID_LEVELS.SINGLE
  if (diskCount === 1) return RAID_LEVELS.SINGLE
  if (diskCount >= 4) {
    return (
      options.find((item) => item.level === RAID_LEVELS.RAID10)?.level ??
      options[0].level
    )
  }
  if (diskCount === 3) {
    return (
      options.find((item) => item.level === RAID_LEVELS.RAID5)?.level ??
      options[0].level
    )
  }
  return (
    options.find((item) => item.level === RAID_LEVELS.RAID1)?.level ??
    options.find((item) => item.level === RAID_LEVELS.RAID0)?.level ??
    options[0].level
  )
}

export function StoragePoolCreator({
  disks,
  onSubmit,
}: StoragePoolCreatorProps) {
  const [poolName, setPoolName] = useState('')
  const [selectedDiskIds, setSelectedDiskIds] = useState<string[]>([])
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

  const raidOptions = useMemo(
    () => buildRaidOptions(selectedSizes),
    [selectedSizes],
  )
  const [raidLevel, setRaidLevel] = useState<RaidLevel>(RAID_LEVELS.SINGLE)

  const availableRaids = useMemo(
    () => raidByCount(selectedCandidates.length),
    [selectedCandidates.length],
  )

  const effectiveRaid: RaidLevel = availableRaids.includes(raidLevel)
    ? raidLevel
    : availableRaids[0] || RAID_LEVELS.SINGLE
  const currentRaidOption =
    raidOptions.find((option) => option.level === effectiveRaid) ?? null

  useEffect(() => {
    if (selectedCandidates.length === 0) {
      setRaidLevel(RAID_LEVELS.SINGLE)
      return
    }
    const recommended = getRecommendedRaid(
      raidOptions,
      selectedCandidates.length,
    )
    setRaidLevel(recommended)
  }, [raidOptions, selectedCandidates.length])

  useEffect(() => {
    if (submitError) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [submitError])

  const toggleDisk = (id: string) => {
    setSelectedDiskIds((current) =>
      current.includes(id) ? current.filter((v) => v !== id) : [...current, id],
    )
  }

  const maskSerial = (serial: string) => {
    const normalized = serial.trim()
    if (!normalized) return '-'
    if (normalized.length <= 4) return normalized
    return `****${normalized.slice(-4)}`
  }

  const canSubmit = selectedDiskIds.length > 0 && poolName.trim().length > 0
  const recommendedRaid = getRecommendedRaid(
    raidOptions,
    selectedCandidates.length,
  )
  const backupRiskLabel =
    currentRaidOption?.backupRisk === 'low'
      ? 'Low'
      : currentRaidOption?.backupRisk === 'medium'
        ? 'Medium'
        : 'High'
  const backupRiskClass =
    currentRaidOption?.backupRisk === 'low'
      ? 'text-emerald-400'
      : currentRaidOption?.backupRisk === 'medium'
        ? 'text-amber-400'
        : 'text-red-400'

  const resetFormState = () => {
    setPoolName('')
    setSelectedDiskIds([])
    setRaidLevel(RAID_LEVELS.SINGLE)
    setSubmitError(null)
  }

  const handleCreate = async () => {
    if (!canSubmit || submitting) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        name: poolName.trim(),
        diskIds: selectedDiskIds,
        raidLevel: effectiveRaid,
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
      <div className="flex-1 space-y-6 p-4 select-text">
        <div className="space-y-3">
          <div className="text-app-text text-xs font-semibold uppercase">
            Storage Name
          </div>
          <Input
            id="storage-pool-name"
            type="text"
            value={poolName}
            onChange={(event) => setPoolName(event.target.value)}
            placeholder="e.g. pool-a"
            className="rounded-lg px-3"
          />
        </div>

        <div className="space-y-3">
          <div className="text-app-text text-xs font-semibold uppercase">
            Disks
            <span className="text-app-text-muted ml-1 normal-case">
              ({selectedDiskIds.length} selected)
            </span>
          </div>
          {raidCandidates.length === 0 && <EmptyState />}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {raidCandidates.map((candidate) => {
              const selected = selectedDiskIds.includes(candidate.path)
              const candidateKind =
                String(candidate.candidateType).toLowerCase() === 'partition'
                  ? 'PARTITION'
                  : 'DISK'
              const availableCapacity = bytesFormat(candidate.sizeBytes, {
                standard: 'm',
                decimalPlaces: 0,
              })
              const serial = candidate.serial || '-'
              return (
                <button
                  key={candidate.path}
                  type="button"
                  onClick={() => toggleDisk(candidate.path)}
                  className={cn(
                    'border-app-border bg-app-bg hover:border-app-border-strong flex items-center justify-between rounded-lg border px-2.5 py-2.5 text-left select-text',
                    selected && 'border-app-border-strong',
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="text-app-text w-14 shrink-0 text-base leading-none font-bold tracking-tight">
                      {availableCapacity}
                    </div>
                    <div className="min-w-0">
                      <div className="text-app-text-muted truncate text-[11px]">
                        SN: {maskSerial(serial)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill color="neutral" content={candidateKind} />
                    {selected ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {selectedDiskIds.length > 0 && (
            <motion.div
              key="raid-and-cache"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="text-app-text text-xs font-semibold uppercase">
                  RAID
                </div>
                <div className="flex flex-nowrap items-center gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {raidOptions.map((option) => {
                    const active = effectiveRaid === option.level
                    return (
                      <button
                        key={option.level}
                        type="button"
                        onClick={() => setRaidLevel(option.level)}
                        className="inline-flex h-8 shrink-0 items-center gap-1.5 px-1 text-left text-sm font-medium whitespace-nowrap"
                      >
                        <span
                          className={cn(
                            'border-app-border inline-block h-3.5 w-3.5 rounded-full border',
                            active && 'border-app-text',
                          )}
                        >
                          {active ? (
                            <span className="bg-app-text mt-[2px] ml-[2px] block h-2 w-2 rounded-full" />
                          ) : null}
                        </span>
                        <span
                          className={cn(
                            'max-w-[132px] truncate',
                            active ? 'text-app-text' : 'text-app-text-muted',
                          )}
                        >
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {currentRaidOption && (
                    <motion.div
                      key={currentRaidOption.level}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16, ease: 'linear' }}
                      className="bg-app-bg border-app-border min-h-[220px] rounded-lg border p-2.5 text-xs"
                    >
                      <div className="text-app-text flex items-center justify-between text-sm font-semibold">
                        <span>{currentRaidOption.label}</span>
                        {currentRaidOption.level === recommendedRaid ? (
                          <span className="text-app-text-muted bg-app-surface rounded px-2 py-0.5 text-[10px] uppercase">
                            Recommended
                          </span>
                        ) : null}
                      </div>
                      <div className="text-app-text-muted mt-0.5 text-[11px]">
                        {currentRaidOption.summary}
                      </div>

                      <div className="mt-2 grid grid-cols-1 gap-1.5 md:grid-cols-3">
                        <div className="bg-app-surface border-app-border rounded-md border px-2 py-1.5">
                          <div className="text-app-text-muted text-[10px] uppercase">
                            Usable Capacity
                          </div>
                          <div className="text-app-text mt-0.5 text-sm font-semibold">
                            {bytesFormat(currentRaidOption.usableBytes, {
                              standard: 'm',
                              decimalPlaces: 0,
                            })}
                          </div>
                        </div>
                        <div className="bg-app-surface border-app-border rounded-md border px-2 py-1.5">
                          <div className="text-app-text-muted text-[10px] uppercase">
                            Fault Tolerance
                          </div>
                          <div className="text-app-text mt-0.5 text-sm font-semibold">
                            {currentRaidOption.faultTolerance}
                          </div>
                        </div>
                        <div className="bg-app-surface border-app-border rounded-md border px-2 py-1.5">
                          <div className="text-app-text-muted text-[10px] uppercase">
                            Backup Risk
                          </div>
                          <div
                            className={cn(
                              'mt-0.5 text-sm font-semibold',
                              backupRiskClass,
                            )}
                          >
                            {backupRiskLabel}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        <div>
                          <div className="text-app-text-muted mb-1 flex items-center justify-between text-[10px] uppercase">
                            <span>Read Speed</span>
                            <span>{currentRaidOption.readScore}%</span>
                          </div>
                          <div className="bg-app-surface h-1 rounded-full">
                            <div
                              className="h-1 rounded-full bg-sky-400"
                              style={{
                                width: `${currentRaidOption.readScore}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-app-text-muted mb-1 flex items-center justify-between text-[10px] uppercase">
                            <span>Write Speed</span>
                            <span>{currentRaidOption.writeScore}%</span>
                          </div>
                          <div className="bg-app-surface h-1 rounded-full">
                            <div
                              className="h-1 rounded-full bg-violet-400"
                              style={{
                                width: `${currentRaidOption.writeScore}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="border-app-border bg-app-hover mt-auto border-t px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-app-text text-xs font-semibold">
              {selectedDiskIds.length} disk
              {selectedDiskIds.length === 1 ? '' : 's'} ·{' '}
              {effectiveRaid.toUpperCase()}
            </div>
          </div>

          <Button
            type="button"
            variant={canSubmit ? 'primary' : 'secondary'}
            disabled={!canSubmit || submitting}
            onClick={handleCreate}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                创建中...
              </span>
            ) : (
              '开始创建存储'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
