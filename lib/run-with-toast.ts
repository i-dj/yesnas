import { toast } from '@/store/use-toast-store'

const getErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

export async function runWithToast<T>({
  task,
  success,
  fail,
  onSuccess,
  rethrow = false,
}: {
  task: () => Promise<T>
  success?: string
  fail: string
  onSuccess?: (result: T) => void
  rethrow?: boolean
}) {
  try {
    const result = await task()
    success && toast.success(success)
    onSuccess?.(result)
    return true
  } catch (error) {
    toast.error(getErrorMessage(error, fail))
    if (rethrow) throw error
    return false
  }
}
