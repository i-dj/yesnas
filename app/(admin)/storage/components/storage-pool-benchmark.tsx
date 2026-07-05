'use client'

import { Button, Progress, SideDrawer } from '@/components/ui'
import { bytesFormat, cn } from '@/lib/utils'
import type { StoragePoolModel } from '@/types/models/storage'
import { HardDrive } from 'lucide-react'
import { getCloudProviderKey, getCloudProviderLogoSrc } from '../utils'
import { StorageSummaryHeader } from './summary/storage-summary-header'

const sizeItems = [
  { value: '1', label: '1G' },
  { value: '5', label: '5G' },
  { value: '10', label: '10G' },
  { value: '20', label: '20G' },
  { value: '50', label: '50G' },
] as const

const cloudProviderLabels = {
  'google-drive': 'Google Drive',
  onedrive: 'OneDrive',
  dropbox: 'Dropbox',
  cloud: 'Cloud Storage',
} as const

function formatSpeed(value: number) {
  return value
    ? `${bytesFormat(value, {
        standard: 's',
        decimalPlaces: 2,
      })}/s`
    : '-'
}

export type BenchmarkStage = 'idle' | 'ready' | 'write' | 'read' | 'completed' | 'failed'

export interface BenchmarkViewState {
  running: boolean
  stage: BenchmarkStage
  sizeGiB: 1 | 5 | 10 | 20 | 50
  percent: number
  totalBytes: number
  completedBytes: number
  remainingBytes: number
  elapsedSeconds: number

  currentSpeedBytesPerSec: number
  writeSpeedBytesPerSec: number
  readSpeedBytesPerSec: number
  error: string | null
}

interface StoragePoolBenchmarkProps {
  open: boolean
  pool: StoragePoolModel | null
  state: BenchmarkViewState
  onOpenChange: (open: boolean) => void
  onSizeChange: (size: 1 | 5 | 10 | 20 | 50) => void
  onStart: () => void
  onStop: () => void
}

export function StoragePoolBenchmark({
  open,
  pool,
  state,
  onOpenChange,
  onSizeChange,
  onStart,
  onStop,
}: StoragePoolBenchmarkProps) {
  const stageLabel =
    state.stage === 'write'
      ? 'Writing'
      : state.stage === 'read'
        ? 'Reading'
        : state.stage === 'ready'
          ? 'Preparing'
          : state.stage === 'completed'
            ? 'Completed'
            : state.stage === 'failed'
              ? 'Failed'
              : '-'
  const testFileBytes = state.sizeGiB * 1024 * 1024 * 1024
  const totalBytes = pool?.totalBytes ?? 0
  const freeBytes = pool?.freeBytes ?? 0
  const cloudProvider = pool?.kind === 'cloud' ? getCloudProviderKey(pool) : null
  const cloudProviderLogoSrc = cloudProvider ? getCloudProviderLogoSrc(cloudProvider) : ''

  const insufficientSpace = freeBytes > 0 ? testFileBytes > freeBytes : false
  const progressPercent = Math.max(0, Math.min(100, state.percent || 0))

  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} title={'Benchmark'}>
      {!pool ? null : (
        <div className="space-y-8 pb-4">
          <StorageSummaryHeader
            title={pool.name}
            subtitle={
              pool.kind === 'cloud' && cloudProvider
                ? cloudProviderLabels[cloudProvider]
                : [pool.raidLevel, pool.filesystem].filter(Boolean).join(' · ')
            }
            icon={pool.kind === 'cloud' ? undefined : HardDrive}
            iconSrc={cloudProviderLogoSrc}
            metrics={[
              {
                label: 'Free space',
                value: bytesFormat(pool.freeBytes, {
                  standard: 's',
                  decimalPlaces: 2,
                }),
              },
            ]}
            usedBytes={pool.usedBytes}
            totalBytes={pool.totalBytes}
            usagePercent={pool.usagePercent}
            pathLabel={pool.kind === 'local' ? pool.dataPath : undefined}
          />

          {pool.kind === 'local' && (
            <div className="space-y-5">
              <div className="text-app-text text-sm font-semibold uppercase">Test File Size</div>
              <div className="border-app-border flex items-center gap-4 border-b pb-2">
                {sizeItems.map((item) => {
                  const active = String(state.sizeGiB) === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => onSizeChange(Number(item.value) as 1 | 5 | 10 | 20 | 50)}
                      className="inline-flex items-center gap-1.5 text-sm"
                    >
                      <span
                        className={cn(
                          'border-app-border inline-block h-3.5 w-3.5 rounded-full border',
                          active && 'border-app-text',
                        )}
                      >
                        {active ? <span className="bg-app-text mt-0.5 ml-0.5 block h-2 w-2 rounded-full" /> : null}
                      </span>
                      <span className={cn(active ? 'text-app-text font-semibold' : 'text-app-text-muted')}>
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-app-text-muted text-sm">Larger test files are more accurate but take more time.</p>
              {insufficientSpace ? (
                <p className="text-xs text-red-400">
                  Insufficient space: selected test size is larger than free space (
                  {bytesFormat(freeBytes, { standard: 's', decimalPlaces: 2 })}).
                </p>
              ) : null}
            </div>
          )}

          <div className="bg-app-hover/20 border-app-border space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-app-text-muted text-[11px] font-medium uppercase">Stage</div>
                <div className="text-app-text mt-1 text-sm font-semibold">{stageLabel}</div>
              </div>
              <div className="text-right">
                <div className="text-app-text-muted text-[11px] font-medium uppercase">Elapsed</div>
                <div className="text-app-text mt-1 font-mono text-sm font-semibold tabular-nums">
                  {state.elapsedSeconds ? `${state.elapsedSeconds.toFixed(1)} s` : '-'}
                </div>
              </div>
            </div>

            <Progress value={progressPercent} showLabel={false} className="bg-blue-500" />
            <div className="text-app-text-muted flex items-center justify-between gap-4 text-xs">
              <span>{Math.round(progressPercent)}%</span>
              <span className="text-app-text shrink-0 font-mono font-semibold tabular-nums">
                {formatSpeed(state.currentSpeedBytesPerSec)}
              </span>
            </div>
          </div>

          {state.stage === 'completed' ? (
            <div className="bg-app-surface border-app-border rounded-lg border p-4">
              <div className="text-app-text-muted text-[11px] font-semibold uppercase">Final Result</div>
              <div className="divide-app-border mt-3 grid grid-cols-2 divide-x">
                <div className="pr-4">
                  <div className="text-app-text-muted text-xs">Read</div>
                  <div className="text-app-text mt-1.5 font-mono text-base font-semibold tabular-nums">
                    {formatSpeed((state.readSpeedBytesPerSec || pool.readSpeedBytesPerSec) ?? 0)}
                  </div>
                </div>
                <div className="pl-4">
                  <div className="text-app-text-muted text-xs">Write</div>
                  <div className="text-app-text mt-1.5 font-mono text-base font-semibold tabular-nums">
                    {formatSpeed((state.writeSpeedBytesPerSec || pool.writeSpeedBytesPerSec) ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end">
            {state.running ? (
              <Button type="button" variant="secondary" onClick={onStop}>
                Stop Benchmark
              </Button>
            ) : (
              <Button type="button" onClick={onStart} disabled={insufficientSpace}>
                Start Benchmark
              </Button>
            )}
          </div>
        </div>
      )}
    </SideDrawer>
  )
}
