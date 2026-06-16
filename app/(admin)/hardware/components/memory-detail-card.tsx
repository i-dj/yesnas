'use client'

import { MemoryStick } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { formatBytes, formatPercent } from '@/lib/utils'
import type { HardwareMemory, HardwareMemoryModule } from '@/types'
import { DetailList, HardwareSection, UsageDonut, type DetailItem } from './hardware-section'

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
    [t('fields.typeSpeed'), `${selectedModule.type || '-'} / ${selectedModule.speedMHz || '-'} MHz`, false],
    [t('fields.capacity'), formatBytes(selectedModule.sizeBytes), false],
    [t('fields.used'), formatBytes(memory.usedBytes), false],
    [t('fields.available'), formatBytes(memory.availableBytes), false],
  ]
  if (selectedModule.serial) details.push([t('fields.serial'), selectedModule.serial, true])

  return (
    <HardwareSection
      icon={MemoryStick}
      accentClassName="text-emerald-400"
      title={t('sections.memory')}
      summary={
        <div className="border-app-border/70 flex max-w-full gap-0.5 overflow-x-auto rounded-md border p-0.5">
          {modules.map((module, index) => (
            <button
              key={`${module.slot || module.locator || module.bankLocator || index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`app-body-text h-7 shrink-0 rounded px-2.5 font-medium transition-colors ${
                selectedIndex === index ? 'bg-app-active text-app-text' : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              {module.slot || module.locator || module.bankLocator || t('overview.memoryModule', { index: index + 1 })}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid min-w-0 gap-5 sm:grid-cols-[4rem_minmax(0,1fr)] sm:items-start lg:gap-8">
        <UsageDonut value={formatPercent(memory.usagePercent)} percent={memory.usagePercent} color="#34d399" />
        <DetailList details={details} />
      </div>
    </HardwareSection>
  )
}
