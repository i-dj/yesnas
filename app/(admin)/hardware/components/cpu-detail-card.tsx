'use client'

import { Cpu } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { formatPercent } from '@/lib/utils'
import type { HardwareCpu } from '@/types'
import { formatOptional } from '../utils'
import { DetailList, HardwareSection, UsageDonut, type DetailItem } from './hardware-section'

export function CpuDetailCard({ cpus }: { cpus: HardwareCpu[] }) {
  const t = useTranslations('Hardware')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const cpu = cpus[Math.min(selectedIndex, cpus.length - 1)]
  const details: DetailItem[] = [
    [t('fields.coresThreads'), `${cpu.cores} / ${cpu.threads}`, false],
    [t('fields.frequency'), `${cpu.frequencyGhz.toFixed(2)} GHz`, false],
    [t('fields.temperature'), formatOptional(cpu.temperatureC, ' °C'), false],
    [t('fields.fanSpeed'), formatOptional(cpu.fanRpm, ' RPM'), false],
    [t('fields.power'), formatOptional(cpu.powerW, ' W'), false],
  ]

  return (
    <HardwareSection
      icon={Cpu}
      title={t('sections.cpu')}
      summary={
        <div className="border-app-border/70 flex max-w-full gap-0.5 overflow-x-auto rounded-md border p-0.5">
          {cpus.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`app-body-text h-7 shrink-0 rounded px-2.5 font-medium transition-colors ${
                selectedIndex === index ? 'bg-app-active text-app-text' : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              {t('overview.processor', { index: index + 1 })}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid min-w-0 gap-3 sm:grid-cols-[4rem_minmax(0,1fr)] sm:items-start">
        <UsageDonut value={formatPercent(cpu.usagePercent)} percent={cpu.usagePercent} color="#38bdf8" />
        <DetailList details={details} />
      </div>
    </HardwareSection>
  )
}
