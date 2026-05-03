import Uppy from '@uppy/core'
import Tus from '@uppy/tus'

// Keep a single Uppy instance for the entire app lifecycle
export const uppy = new Uppy({
  id: 'main-uploader',
  autoProceed: true, // Start uploading immediately after file selection
  restrictions: {
    maxNumberOfFiles: 20000,
    maxFileSize: 1024 * 1024 * 1000 * 100, // Limit uploads to 100 GB
  },
}).use(Tus, {
  endpoint: 'https://tusd.tusdemo.net/files/', // Replace with the real Tus backend endpoint
  retryDelays: [0, 1000, 3000, 5000],
  chunkSize: 5 * 1024 * 1024, // 5 MB chunks
})
