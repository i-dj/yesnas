'use client'

import { Cpu } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Card, Progress } from '@/components/ui'
import { formatPercent } from '@/lib/utils'
import type { HardwareCpu } from '@/types'
import { formatOptional } from '../utils'
import { DetailList, HardwareSection, HardwareSelector, type DetailItem } from './hardware-section'

export function CpuDetailCard({ cpus }: { cpus: HardwareCpu[] }) {
  const t = useTranslations('Hardware')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const cpu = cpus[Math.min(selectedIndex, cpus.length - 1)]
  const details: DetailItem[] = [
    [t('fields.productModel'), cpu.model || '-', true],
    [t('fields.coresThreads'), `${cpu.cores} / ${cpu.threads}`, false],
    [t('fields.frequency'), `${cpu.frequencyGhz.toFixed(2)} GHz`, false],
    [t('fields.temperature'), formatOptional(cpu.temperatureC, ' °C'), false],
    [t('fields.fanSpeed'), formatOptional(cpu.fanRpm, ' RPM'), false],
    [t('fields.power'), formatOptional(cpu.powerW, ' W'), false],
  ]

  return (
    <HardwareSection icon={Cpu} title={t('sections.cpu')}>
      <Card className="@container flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex min-w-0 justify-start">
            <HardwareSelector
              items={cpus.map((_, index) => t('overview.processor', { index: index + 1 }))}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              className="w-fit"
            />
          </div>
          <DetailList details={details} />
          <div className="border-app-border mt-auto min-w-0 border-t pt-3">
            <div className="mb-3 flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <div className="text-app-text min-w-0 truncate text-sm font-semibold tabular-nums">
                {formatPercent(cpu.usagePercent)}
              </div>
              <div className="text-app-text-muted shrink-0 text-sm">{t('fields.usageRate')}</div>
            </div>
            <Progress value={cpu.usagePercent} showLabel={false} className="bg-sky-400" />
          </div>
        </div>
      </Card>
    </HardwareSection>
  )
}
