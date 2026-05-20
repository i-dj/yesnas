import type { ToastVariant } from '@/components/ui/toast'
import { toast } from '@/store/use-toast-store'

export const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

export interface RunWithToastParams {
  task: () => Promise<void>
  success?: { title: string; description: string; durationMs?: number }
  fail: { title: string; fallback: string; durationMs?: number }
  rethrowOnFail?: boolean
}

export interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

export async function runWithToast(
  { task, success, fail, rethrowOnFail = false }: RunWithToastParams,
): Promise<boolean> {
  try {
    await task()
    if (success) {
      toast.success(success.title, success.description, success.durationMs)
    }
    return true
  } catch (error) {
    toast.error(
      fail.title,
      getErrorMessage(error, fail.fallback),
      fail.durationMs ?? 5000,
    )
    if (rethrowOnFail) throw error
    return false
  }
}
