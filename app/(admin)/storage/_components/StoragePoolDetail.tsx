'use client'

import { SideDrawer } from '@/components/ui'
import { bytesFormat } from '@/lib/utils'
import type { StoragePoolModel } from '@/types/models/storage'

interface StoragePoolDetailProps {
  open: boolean
  activePool: StoragePoolModel | null
  onOpenChange: (open: boolean) => void
}

export function StoragePoolDetail({
  open,
  activePool,
  onOpenChange,
}: StoragePoolDetailProps) {
  return (
    <SideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={activePool ? `${activePool.name} Details` : 'Pool Details'}
    >
      {!activePool ? (
        <div className="text-app-text-muted text-sm">No pool selected.</div>
      ) : (
        <div className="space-y-3">
          {[
            ['Pool Name', activePool.name],
            ['RAID Level', activePool.raidLevel],
            [
              'Used',
              bytesFormat(activePool.usedBytes ?? 0, {
                standard: 'm',
                decimalPlaces: 2,
              }),
            ],
            [
              'Total',
              bytesFormat(activePool.totalBytes ?? 0, {
                standard: 'm',
                decimalPlaces: 2,
              }),
            ],
            ['Status', activePool.status],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="bg-app-bg border-app-border grid grid-cols-[140px_minmax(0,1fr)] rounded-lg border p-3"
            >
              <div className="text-app-text-muted text-xs font-semibold uppercase">
                {label}
              </div>
              <div className="text-app-text text-sm">{value}</div>
            </div>
          ))}

          <div className="border-app-border mt-2 border-t pt-3">
            <div className="text-app-text mb-2 text-xs font-semibold uppercase">
              Actions
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => console.log('format pool:', activePool.id)}
                className="bg-app-bg border-app-border text-app-text hover:border-app-border-strong rounded-md border px-3 py-2 text-left text-xs font-medium"
              >
                Format Pool
              </button>
              <button
                type="button"
                onClick={() => console.log('speed test pool:', activePool.id)}
                className="bg-app-bg border-app-border text-app-text hover:border-app-border-strong rounded-md border px-3 py-2 text-left text-xs font-medium"
              >
                Run Speed Test
              </button>
            </div>
          </div>
        </div>
      )}
    </SideDrawer>
  )
}
