'use client'

import { MemoryStick } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Card, Progress } from '@/components/ui'
import { formatBytes } from '@/lib/utils'
import type { HardwareMemory, HardwareMemoryModule } from '@/types'
import { DetailList, HardwareSection, HardwareSelector, type DetailItem } from './hardware-section'

export function MemoryDetailCard({ memory }: { memory: HardwareMemory }) {
  const t = useTranslations('Hardware')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const modules: HardwareMemoryModule[] = memory.modules?.length
    ? memory.modules
    : [
        {
          sizeBytes: memory.totalBytes,
          type: memory.type,
          speedMHz: memory.speedMHz,
          manufacturer: memory.manufacturer,
          partNumber: memory.partNumber,
        },
      ]
  const selectedModule = modules[Math.min(selectedIndex, modules.length - 1)]
  const details: DetailItem[] = [
    [t('fields.manufacturer'), selectedModule.manufacturer || '-', true],
    [t('fields.partNumber'), selectedModule.partNumber || '-', true],
    [t('fields.type'), selectedModule.type || '-', true],
    [t('fields.speed'), selectedModule.speedMHz ? `${selectedModule.speedMHz} MHz` : '-', true],
  ]
  if (selectedModule.serial) details.push([t('fields.serial'), selectedModule.serial, true])

  return (
    <HardwareSection icon={MemoryStick} accentClassName="text-emerald-400" title={t('sections.memory')}>
      <Card className="@container flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex min-w-0 justify-start">
            <HardwareSelector
              items={modules.map(
                (module, index) =>
                  module.slot ||
                  module.locator ||
                  module.bankLocator ||
                  t('overview.memoryModule', { index: index + 1 }),
              )}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              className="w-fit"
            />
          </div>
          <DetailList details={details} />
          <div className="border-app-border mt-auto min-w-0 border-t pt-3">
            <div className="mb-3 flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <div className="text-app-text min-w-0 truncate text-sm font-semibold tabular-nums">
                {formatBytes(memory.usedBytes)}
                <span className="text-app-text-muted font-medium"> / {formatBytes(memory.totalBytes)}</span>
              </div>
              <div className="text-app-text-muted shrink-0 text-sm tabular-nums">
                {t('fields.available')} {formatBytes(memory.availableBytes)}
              </div>
            </div>
            <Progress value={memory.usagePercent} showLabel={false} className="bg-emerald-400" />
          </div>
        </div>
      </Card>
    </HardwareSection>
  )
}
