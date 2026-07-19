import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.168.3"],
  turbopack: {
    root: process.cwd(),
  },
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
