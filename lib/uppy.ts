import Uppy from '@uppy/core'
import Tus, { type TusOptions } from '@uppy/tus'

const TUS_ENDPOINT = 'http://yesnas:8080/api/v1/uploads/tus'
const TUS_CHUNK_SIZE = 1 * 1024 * 1024

const isTargetAlreadyExistsError = (error: {
  message?: string
  originalResponse?: { getBody?: () => string } | null
}) => {
  const message = `${error.message ?? ''} ${error.originalResponse?.getBody?.() ?? ''}`.toLowerCase()
  return message.includes('target file already exists')
}

const uploadLogger = {
  debug: () => undefined,
  warn: (...args: unknown[]) => console.warn('[Uppy]', ...args),
  // Upload failures are surfaced through the upload store and Toast.
  // Any console error here makes Next.js development mode show an error overlay.
  error: () => undefined,
}

const tusOptions: TusOptions<any, any> = {
  endpoint: TUS_ENDPOINT,
  limit: 1,
  retryDelays: [0, 1000, 3000, 5000, 10000, 20000, 30000],
  chunkSize: TUS_CHUNK_SIZE,
  removeFingerprintOnSuccess: true,
  onShouldRetry: (error, _retryAttempt, _options, next) => {
    if (isTargetAlreadyExistsError(error)) return false
    return next(error)
  },
}

const globalForUppy = globalThis as typeof globalThis & {
  __yesnasUppy?: Uppy
}

// Preserve one instance across route changes and development hot reloads.
export const uppy =
  globalForUppy.__yesnasUppy ??
  new Uppy({
    id: 'main-uploader',
    logger: uploadLogger,
    autoProceed: true,
    restrictions: {
      maxNumberOfFiles: 20000,
      maxFileSize: 1024 * 1024 * 1000 * 100,
    },
  }).use(Tus, tusOptions)

globalForUppy.__yesnasUppy = uppy

// Hot reload may reuse an instance created with older options.
uppy.setOptions({ logger: uploadLogger })
uppy.getPlugin('Tus')?.setOptions(tusOptions)
