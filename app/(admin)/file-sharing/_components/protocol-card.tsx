'use client'

import { Button, Tooltip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Copy, NetworkIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ProtocolItem } from '../_types'

interface ProtocolCardProps {
  protocol: ProtocolItem
  onToggle: () => void
}

export function ProtocolCard({ protocol, onToggle }: ProtocolCardProps) {
  const t = useTranslations('FileSharing')
  const endpoint = `${protocol.shareUrl}:${protocol.port}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(endpoint)
    } catch {
      //
    }
  }

  return (
    <section className="border-app-border bg-app-bg flex min-h-[136px] flex-col rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-app-hover text-app-text inline-flex size-8 shrink-0 items-center justify-center rounded-full">
            <NetworkIcon className="size-4" />
          </span>

          <h3 className="text-app-text truncate text-sm font-semibold">{t(`protocols.${protocol}.name`)}</h3>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'relative h-5 w-10 rounded-full p-0',
            'border-none hover:text-white',
            protocol.active ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-app-hover hover:bg-app-hover',
          )}
          aria-label={t(protocol.active ? 'actions.disable' : 'actions.enable')}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0 h-4 w-4 rounded-full bg-white transition-transform',
              protocol.active ? 'translate-x-5.5' : 'translate-x-0.5',
            )}
          />
        </Button>
      </div>

      <p className="text-app-text-muted mt-2 truncate text-xs">{t(`protocols.${protocol}.description`)}</p>

      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px]">
        <span
          className={cn('size-1.5 shrink-0 rounded-full', protocol.active ? 'bg-emerald-400' : 'bg-app-text-muted/45')}
        />

        <span className="text-app-text-muted min-w-0 truncate">
          {protocol.serviceName}
          {' · '}
          {protocol.status}
          {' · '}
          {t('shareCount', {
            count: protocol.shareCount,
          })}
        </span>
      </div>

      <div className="mt-auto flex h-9 pt-2.5">
        <div className="bg-app-hover/45 flex w-full min-w-0 items-center justify-between gap-2 rounded-md px-2.5 py-1.5">
          <div className="text-app-text min-w-0 truncate font-mono text-xs">{endpoint}</div>

          <Tooltip content={t('actions.copy')}>
            <Button variant="ghost" size="xs" icon={Copy} className="h-5 w-5 rounded p-0" onClick={handleCopy} />
          </Tooltip>
        </div>
      </div>
    </section>
  )
}
