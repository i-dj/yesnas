'use client'

import {
  useGlobalConfirmStore,
  type GlobalConfirmOptions,
} from '@/store/use-global-confirm-store'

export function useConfirmModal() {
  const openConfirm = useGlobalConfirmStore((state) => state.openConfirm)

  const confirm = (options: GlobalConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      openConfirm(options, resolve)
    })

  return { confirm }
}

