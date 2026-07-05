'use client'

import { Button, EmptyState, Input, SideDrawer, StatusPill } from '@/components/ui'
import { bytesFormat, formatSmartTime } from '@/lib/utils'
import type { StoragePoolModel } from '@/types/models/storage'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Cloud,
  HardDrive,
  ShieldAlert,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { StorageDetailList, StorageDetailSection } from './storage-detail-section'
import { StorageSummaryHeader } from './summary/storage-summary-header'
import {
  getCloudAccountLabel,
  getCloudProviderKey,
  getCloudProviderLogoSrc,
  getCloudStatusBadge,
  getLocalHealthBadge,
  getPoolMemberStatus,
  displayValue,
} from '../utils'

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
  onReplaceDisk?: (
    pool: StoragePoolModel,
    payload: {
      oldDevicePath: string
      newDevicePath: string
      password: string
    },
  ) => Promise<void>
}

const cloudProviderLabels = {
  'google-drive': 'Google Drive',
  onedrive: 'OneDrive',
  dropbox: 'Dropbox',
  cloud: 'Cloud Storage',
} as const

export function StoragePoolDetail({
  open,
  activePool,
  replaceCandidates = [],
  onOpenChange,
  onReplaceDisk,
}: StoragePoolDetailProps) {
  const [replaceTargetPath, setReplaceTargetPath] = useState<string | null>(null)
  const [replaceNewPath, setReplaceNewPath] = useState('')
  const [replacePassword, setReplacePassword] = useState('')
  const [replaceSubmitting, setReplaceSubmitting] = useState(false)

  useEffect(() => {
    if (open) return
    setReplaceTargetPath(null)
    setReplaceNewPath('')
    setReplacePassword('')
    setReplaceSubmitting(false)
  }, [open])

  useEffect(() => {
    setReplaceTargetPath(null)
    setReplaceNewPath('')
    setReplacePassword('')
    setReplaceSubmitting(false)
  }, [activePool?.id])

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

  const warnings = [...(activePool?.warnings ?? [])]
  const cloudUnmountedWarning = 'äº‘ç›˜è´¦å·å¯è®¿é—®ï¼Œä½†æœ¬åœ°æŒ‚è½½æœªæ¿€æ´»ï¼ŒSMB æˆ–æœ¬åœ°è·¯å¾„è®¿é—®å¯èƒ½ä¸å¯ç”¨ã€‚'
  if (activePool?.kind === 'cloud' && !activePool.mounted && !warnings.includes(cloudUnmountedWarning)) {
    warnings.unshift(cloudUnmountedWarning)
  }
  const isCloudPool = activePool?.kind === 'cloud'
  const cloudProvider = isCloudPool && activePool ? getCloudProviderKey(activePool) : null
  const cloudProviderLogoSrc = cloudProvider ? getCloudProviderLogoSrc(cloudProvider) : ''
  const cloudAccount = activePool ? getCloudAccountLabel(activePool) : ''
  const detailBadge = activePool
    ? activePool.kind === 'cloud'
      ? getCloudStatusBadge(activePool)
      : getLocalHealthBadge(activePool.health)
    : null

  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} title={isCloudPool ? 'Cloud Storage' : 'Pool Details'}>
      {!activePool ? (
        <div className="text-app-text-muted text-sm">No pool selected.</div>
      ) : (
        <div className="space-y-5">
          <StorageSummaryHeader
            title={activePool.name}
            subtitle={
              activePool.kind === 'cloud' && cloudProvider
                ? cloudProviderLabels[cloudProvider]
                : [activePool.raidLevel, activePool.filesystem].filter(Boolean).join(' Â· ').toUpperCase()
            }
            icon={activePool.kind === 'cloud' ? undefined : HardDrive}
            iconSrc={cloudProviderLogoSrc}
            metrics={[
              {
                label: 'Free space',
                value: bytesFormat(activePool.freeBytes, {
                  standard: 's',
                  decimalPlaces: 2,
                }),
              },
            ]}
            usedBytes={activePool.usedBytes}
            totalBytes={activePool.totalBytes}
            usagePercent={activePool.usagePercent}
            pathLabel={activePool.kind === 'local' ? activePool.dataPath : undefined}
          />

          <StorageDetailSection
            icon={activePool.kind === 'cloud' ? Cloud : HardDrive}
            title="Storage Information"
            action={detailBadge ? <StatusPill color={detailBadge.color} content={detailBadge.content} /> : null}
          >
            <StorageDetailList
              items={[
                ...(activePool.kind === 'cloud'
                  ? [
                      {
                        label: 'Provider',
                        value: cloudProvider ? cloudProviderLabels[cloudProvider] : activePool.filesystem || '-',
                        fullWidth: true,
                      },
                      { label: 'Account', value: displayValue(cloudAccount), fullWidth: true },
                      {
                        label: 'Mount Path',
                        value: displayValue(activePool.mountPath || activePool.dataPath),
                        fullWidth: true,
                      },
                    ]
                  : []),
                {
                  label: activePool.kind === 'cloud' ? 'Download' : 'Read Speed',
                  value: (
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowDown className="h-3.5 w-3.5 text-sky-400" />
                      {activePool.readSpeedBytesPerSec
                        ? `${bytesFormat(activePool.readSpeedBytesPerSec, {
                            standard: 'm',
                            decimalPlaces: 2,
                          })}/s`
                        : '-'}
                    </span>
                  ),
                },
                {
                  label: activePool.kind === 'cloud' ? 'Upload' : 'Write Speed',
                  value: (
                    <span className="inline-flex items-center gap-1.5">
                      <ArrowUp className="h-3.5 w-3.5 text-violet-400" />
                      {activePool.writeSpeedBytesPerSec
                        ? `${bytesFormat(activePool.writeSpeedBytesPerSec, {
                            standard: 'm',
                            decimalPlaces: 2,
                          })}/s`
                        : '-'}
                    </span>
                  ),
                },
                { label: 'Created At', value: formatSmartTime(activePool.createdAt) },
                { label: 'Last Checked', value: formatSmartTime(activePool.lastCheckedAt) },
              ]}
            />
          </StorageDetailSection>

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
                <div className="border-app-border flex items-center gap-1.5 border-b pb-1">
                  <HardDrive className="text-app-text-muted h-4 w-4" />
                  <span className="text-app-text text-sm font-semibold uppercase">RAID Members</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {activePool.devices.map((device) => {
                    const memberStatus = getPoolMemberStatus(device)
                    return (
                      <div key={device.id || device.devicePath} className="space-y-1">
                        <div className="bg-app-hover/25 flex items-center justify-between gap-2 rounded-md px-2 py-1.5">
                          <div className="min-w-0">
                            <div className="text-app-text mb-1 truncate text-sm">{device.model}</div>
                            <div className="text-app-text-muted truncate text-[13px]">SN: {device.serial}</div>
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
                              <div className="text-app-text-muted text-xs">Select replacement disk</div>
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
                                        {candidate.label} Â·{' '}
                                        {bytesFormat(candidate.sizeBytes ?? 0, {
                                          standard: 'm',
                                          decimalPlaces: 0,
                                        })}{' '}
                                        Â· {candidate.kind.toUpperCase()}
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
                                className="text-xs"
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
            </>
          )}
        </div>
      )}
    </SideDrawer>
  )
}
