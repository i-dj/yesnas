'use client'

import { Button, Progress, SideDrawer } from '@/components/ui'
import { calculateUsedPercent, cn, getProgressColorClass } from '@/lib/utils'
import { bytesFormat } from '@/lib/utils'
import type { StoragePoolModel } from '@/types/models/storage'

const sizeItems = [
  { value: '1', label: '1G' },
  { value: '5', label: '5G' },
  { value: '10', label: '10G' },
  { value: '20', label: '20G' },
  { value: '50', label: '50G' },
] as const

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

  const usedPercent = calculateUsedPercent(pool?.usedBytes ?? 0, totalBytes)
  const insufficientSpace = freeBytes > 0 ? testFileBytes > freeBytes : false
  const progressPercent = Math.max(0, Math.min(100, state.percent || 0))

  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} title={'Benchmark'}>
      {!pool ? null : (
        <div className="space-y-8 pb-4">
          <div className=" ">
            <div className="text-app-text text-sm font-semibold">{pool.name}</div>
            <div className="text-app-text-muted mt-1.5 truncate text-xs uppercase">
              {pool.kind === 'local' ? pool.raidLevel + ' · ' : ''}
              {pool.filesystem}
            </div>
            <div className="mt-2">
              <Progress value={usedPercent} showLabel={false} className={getProgressColorClass(usedPercent)} />{' '}
              <div className="text-app-text-muted flex items-center justify-between text-xs">
                <span>
                  {bytesFormat(pool.usedBytes ?? 0, {
                    standard: 's',
                    decimalPlaces: 2,
                  })}{' '}
                  /{' '}
                  {bytesFormat(pool.totalBytes ?? 0, {
                    standard: 's',
                    decimalPlaces: 2,
                  })}
                </span>
                <span>{Math.round(usedPercent)}%</span>
              </div>
            </div>
          </div>

          {pool.kind === 'local' && (
            <div className="space-y-5">
              <div className="text-app-text text-xs font-semibold uppercase">Test File Size</div>
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
                        {active ? <span className="bg-app-text mt-[2px] ml-[2px] block h-2 w-2 rounded-full" /> : null}
                      </span>
                      <span className={cn(active ? 'text-app-text font-semibold' : 'text-app-text-muted')}>
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-app-text-muted text-xs">Larger test files are more accurate but take more time.</p>
              {insufficientSpace ? (
                <p className="text-xs text-red-400">
                  Insufficient space: selected test size is larger than free space (
                  {bytesFormat(freeBytes, { standard: 's', decimalPlaces: 2 })}).
                </p>
              ) : null}
            </div>
          )}

          <div className="bg-app-surface border-app-border space-y-1.5 rounded-lg border p-3">
            <div className="text-app-text-muted text-xs">Stage: {stageLabel}</div>

            <Progress value={progressPercent} showLabel={false} className="bg-blue-500" />
            <div className="text-app-text-muted flex items-center justify-between text-xs">
              <span>
                {bytesFormat(state.completedBytes, {
                  standard: 's',
                  decimalPlaces: 2,
                })}{' '}
                /{' '}
                {bytesFormat(state.totalBytes, {
                  standard: 's',
                  decimalPlaces: 2,
                })}{' '}
                <span>({Math.round(progressPercent)}%)</span>
              </span>
              <span>
                {state.currentSpeedBytesPerSec
                  ? `${bytesFormat(state.currentSpeedBytesPerSec, {
                      standard: 's',
                      decimalPlaces: 2,
                    })}/s`
                  : '-'}
              </span>
            </div>
            <div className="text-app-text-muted text-xs">
              Elapsed:
              {state.elapsedSeconds ? `${state.elapsedSeconds.toFixed(1)}s` : '-'}
            </div>
          </div>

          {state.stage === 'completed' ? (
            <div className="bg-app-surface border-app-border rounded-lg border p-3">
              <div className="text-app-text text-xs font-semibold uppercase">Final Result</div>
              <div className="text-app-text-muted mt-2 text-xs">
                Read:{' '}
                {state.readSpeedBytesPerSec || pool.readSpeedBytesPerSec
                  ? `${bytesFormat((state.readSpeedBytesPerSec || pool.readSpeedBytesPerSec) ?? 0, {
                      standard: 's',
                      decimalPlaces: 2,
                    })}/s`
                  : '-'}
              </div>
              <div className="text-app-text-muted text-xs">
                Write:{' '}
                {state.writeSpeedBytesPerSec || pool.writeSpeedBytesPerSec
                  ? `${bytesFormat((state.writeSpeedBytesPerSec || pool.writeSpeedBytesPerSec) ?? 0, {
                      standard: 's',
                      decimalPlaces: 2,
                    })}/s`
                  : '-'}
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
