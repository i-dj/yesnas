'use client'

import { ConfirmModal } from './confirm-modal'
import { useGlobalConfirmStore } from '@/store/use-global-confirm-store'

export function GlobalConfirmModal() {
  const open = useGlobalConfirmStore((state) => state.open)
  const loading = useGlobalConfirmStore((state) => state.loading)
  const options = useGlobalConfirmStore((state) => state.options)
  const setLoading = useGlobalConfirmStore((state) => state.setLoading)
  const close = useGlobalConfirmStore((state) => state.close)
  const resolveAndClose = useGlobalConfirmStore((state) => state.resolveAndClose)

  if (!options) return null

  return (
    <ConfirmModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close()
      }}
      title={options.title}
      description={options.description}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      isDestructive={options.isDestructive}
      focusFirstInput={options.focusFirstInput}
      loading={loading}
      onConfirm={async () => {
        try {
          setLoading(true)
          await options.onConfirm?.()
          resolveAndClose(true)
        } catch {
          setLoading(false)
        }
      }}
    >
      {options.children}
    </ConfirmModal>
  )
}
