import { Card } from '@/components/ui'
import { useTranslations } from 'next-intl'

import {
  HtopTable,
  InfoCard,
  NetworkFlowChart,
  Speedometer,
} from './components'

export default function DashboardPage() {
  const t = useTranslations('Dashboard')

  return (
    <div className="flex flex-col gap-3 pt-10">
      {/* Main content area */}
      <div className="flex h-auto flex-col gap-4 lg:h-[25rem] lg:flex-row">
        {/* Main chart section */}
        <div className="w-full lg:flex-1">
          <div className="h h-full rounded-lg border border-neutral-200 bg-white p-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                {t('title')}
              </h2>
              <div className="flex gap-2">
                <button className="rounded-md bg-neutral-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                  {t('timeRanges.oneHour')}
                </button>
                <button className="rounded-md px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                  {t('timeRanges.twentyFourHours')}
                </button>
                <button className="rounded-md px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                  {t('timeRanges.sevenDays')}
                </button>
              </div>
            </div>
            <div className="flex h-[calc(100%-3rem)] w-full">
              <NetworkFlowChart />
            </div>
          </div>
        </div>

        {/* Metric cards */}
        <div className="w-full lg:w-64">
          <div className="flex h-full flex-col gap-4">
            {/* CPU cards */}

            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-3">
                <h4 className="font-bold">CPU</h4>
                <div className="mt-1 flex flex-row items-end justify-between">
                  <div className="flex w-28 flex-col gap-1 text-sm">
                    <div className="flex flex-row justify-between px-2">
                      {t('metrics.used')}
                      <b>23M</b>
                    </div>
                    <div className="1 flex flex-row justify-between px-2">
                      {t('metrics.free')} <b>10M</b>
                    </div>
                    <div className="flex flex-row justify-between rounded bg-neutral-100 px-2">
                      {t('metrics.total')} <b>30M</b>
                    </div>
                  </div>

                  <div className="h-16 w-16">
                    <Speedometer baseColor="#e5e7eb"></Speedometer>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
      {/* Hardware details */}
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* System version */}
        <InfoCard
          title={t('systemInfo.title')}
          items={[
            { label: t('systemInfo.os'), value: 'Ubuntu 23.99' },
            { label: t('systemInfo.version'), value: 'V1.002' },
            { label: t('systemInfo.uptime'), value: t('systemInfo.uptimeValue') },
            { label: t('systemInfo.lastBoot'), value: t('systemInfo.lastBootValue') },
            { label: t('systemInfo.ipAddress'), value: '192.168.11.21' },
          ]}
        />

        {/* Hardware specs */}
        <InfoCard
          title={t('hardwareInfo.title')}
          items={[
            { label: t('hardwareInfo.cpu'), value: 'AMD 5900X3D' },
            { label: t('hardwareInfo.gpu'), value: 'GeFoce 5900' },
            { label: t('hardwareInfo.motherboard'), value: t('hardwareInfo.motherboardValue') },
            { label: t('hardwareInfo.systemDisk'), value: t('hardwareInfo.systemDiskValue') },
            { label: t('hardwareInfo.memory'), value: t('hardwareInfo.memoryValue') },
          ]}
        />
      </div>
      {/* Process monitor */}
      <Card title={t('processes.title')}>
        <HtopTable />
      </Card>
    </div>
  )
}
