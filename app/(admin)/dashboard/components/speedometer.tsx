'use client'
import { useEffect, useState } from 'react'

interface SpeedometerProps {
  baseColor?: string
}

export const Speedometer = ({ baseColor = '#1f2937' }: SpeedometerProps) => {
  const [speed, setSpeed] = useState(0)
  const [angle, setAngle] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const newSpeed = Math.floor(Math.random() * 101)
      setSpeed(newSpeed)
      setAngle((newSpeed / 100) * 360)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  /** -----------------------------
   * Range-based gradient interpolation
   * ----------------------------- */
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  const lerpColor = (color1: string, color2: string, t: number) => {
    const c1 = parseInt(color1.slice(1), 16)
    const c2 = parseInt(color2.slice(1), 16)

    const r1 = (c1 >> 16) & 255
    const g1 = (c1 >> 8) & 255
    const b1 = c1 & 255

    const r2 = (c2 >> 16) & 255
    const g2 = (c2 >> 8) & 255
    const b2 = c2 & 255

    const r = Math.round(lerp(r1, r2, t))
    const g = Math.round(lerp(g1, g2, t))
    const b = Math.round(lerp(b1, b2, t))

    return `rgb(${r}, ${g}, ${b})`
  }

  /** Multi-stop gradient interpolation driven by speed */
  const getGradientColor = (value: number) => {
    if (value <= 30) return '#10b981' // Green
    if (value <= 50) return lerpColor('#10b981', '#3b82f6', (value - 30) / 20) // Green -> Blue
    if (value <= 70) return lerpColor('#3b82f6', '#f59e0b', (value - 50) / 20) // Blue -> Yellow
    if (value <= 85) return lerpColor('#f59e0b', '#f97316', (value - 70) / 15) // Yellow -> Orange
    return lerpColor('#f97316', '#ef4444', (value - 85) / 15) // Orange -> Red
  }

  const color = getGradientColor(speed)

  /** Arc geometry */
  const radius = 140
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (angle / 360) * circumference

  return (
    <div className="relative h-full w-full overflow-hidden">
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 320 320"
        preserveAspectRatio="none"
      >
        {/* Background ring */}
        <circle
          cx="160"
          cy="160"
          r="140"
          fill="none"
          stroke={baseColor}
          strokeWidth="20"
        />

        {/* Foreground gradient arc */}
        <circle
          cx="160"
          cy="160"
          r="140"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-[800ms] ease-linear"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-[1rem] font-bold">{speed}%</div>
      </div>
    </div>
  )
}
