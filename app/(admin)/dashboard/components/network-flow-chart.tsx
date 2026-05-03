'use client'

import {
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
} from 'chart.js'
import { useEffect, useRef, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { useTranslations } from 'next-intl'

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
)

export const NetworkFlowChart = () => {
  const t = useTranslations('Dashboard.chart')
  const chartRef = useRef<ChartJS<'line', number[], string>>(null)

  const MAX_POINTS = 10
  const [labels, setLabels] = useState<string[]>([])
  const [uploadData, setUploadData] = useState<number[]>([])
  const [downloadData, setDownloadData] = useState<number[]>([])

  // Random helper within a range
  const randRange = (min: number, max: number) =>
    parseFloat((Math.random() * (max - min) + min).toFixed(2))

  // Initialize seed data
  useEffect(() => {
    const now = new Date()
    const initialLabels: string[] = []
    const initialUpload: number[] = []
    const initialDownload: number[] = []

    for (let i = MAX_POINTS; i > 0; i--) {
      const pastTime = new Date(now.getTime() - i * 1000)
      initialLabels.push(pastTime.toLocaleTimeString())

      // Upload: 500M - 1000M
      initialUpload.push(randRange(500, 1000))

      // Download: 10K - 100M (10K = 0.01M)
      initialDownload.push(randRange(0.01, 100))
    }

    setLabels(initialLabels)
    setUploadData(initialUpload)
    setDownloadData(initialDownload)
  }, [])

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = new Date().toLocaleTimeString()

      const newUpload = randRange(500, 1000) // Upload 500~1000M
      const newDownload = randRange(0.01, 100) // Download 0.01~100M

      setUploadData((prev) => {
        const arr = [...prev, newUpload]
        return arr.length > MAX_POINTS ? arr.slice(-MAX_POINTS) : arr
      })

      setDownloadData((prev) => {
        const arr = [...prev, newDownload]
        return arr.length > MAX_POINTS ? arr.slice(-MAX_POINTS) : arr
      })

      setLabels((prev) => {
        const arr = [...prev, newTime]
        return arr.length > MAX_POINTS ? arr.slice(-MAX_POINTS) : arr
      })

      chartRef.current?.update('none')
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const data = {
    labels,
    datasets: [
      {
        label: t('uploadTraffic'),
        data: uploadData,
        borderColor: '#3b82f6',
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart
          const { ctx: c, chartArea } = chart
          if (!chartArea) return 'rgba(59,130,246,0.2)'
          const gradient = c.createLinearGradient(
            0,
            chartArea.bottom,
            0,
            chartArea.top,
          )
          gradient.addColorStop(0, 'rgba(59,130,246,0.2)')
          gradient.addColorStop(1, 'rgba(59,130,246,0)')
          return gradient
        },
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
      {
        label: t('downloadTraffic'),
        data: downloadData,
        borderColor: '#10b981',
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart
          const { ctx: c, chartArea } = chart
          if (!chartArea) return 'rgba(16,185,129,0.2)'
          const gradient = c.createLinearGradient(
            0,
            chartArea.bottom,
            0,
            chartArea.top,
          )
          gradient.addColorStop(0, 'rgba(16,185,129,0.2)')
          gradient.addColorStop(1, 'rgba(16,185,129,0)')
          return gradient
        },
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
    ],
  }

  // Update the Y-axis range from the current data
  const maxY = Math.max(
    ...uploadData,
    ...downloadData,
    1000, // Prevent the initial range from being too small
  )

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      tooltip: { enabled: false },
      legend: { display: true, position: 'bottom' },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
      },
      y: {
        min: 0,
        max: Math.ceil(maxY / 100) * 100, // Round up automatically, e.g. 1000 -> 1100
        ticks: {
          callback: (v) => v + ' Mbps',
        },
        grid: {
          color: 'rgba(0,0,0,0.08)',
        },
        border: { display: false },
      },
    },
  }

  return (
    <div className="h-full w-full">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  )
}
