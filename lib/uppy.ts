import Uppy from '@uppy/core'
import Tus from '@uppy/tus'

const TUS_ENDPOINT = 'http://yesnas:8080/api/v1/uploads/tus'
const TUS_CHUNK_SIZE = 1 * 1024 * 1024

// Keep a single Uppy instance for the entire app lifecycle
export const uppy = new Uppy({
  id: 'main-uploader',
  autoProceed: true, // Start uploading immediately after file selection
  restrictions: {
    maxNumberOfFiles: 20000,
    maxFileSize: 1024 * 1024 * 1000 * 100, // Limit uploads to 100 GB
  },
}).use(Tus, {
  endpoint: TUS_ENDPOINT,
  limit: 1,
  retryDelays: [0, 1000, 3000, 5000, 10000, 20000, 30000],
  chunkSize: TUS_CHUNK_SIZE,
  removeFingerprintOnSuccess: true,
})
