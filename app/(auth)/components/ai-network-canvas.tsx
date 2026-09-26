'use client'

import { useEffect, useRef } from 'react'

const nodes = [
  { x: 190, y: 165, color: '#36cbb8', icon: 'image' },
  { x: 590, y: 165, color: '#ab7ee5', icon: 'video' },
  { x: 100, y: 365, color: '#43b4ed', icon: 'search' },
  { x: 680, y: 365, color: '#e3bf4e', icon: 'shield' },
  { x: 390, y: 625, color: '#36cbb8', icon: 'database' },
  { x: 390, y: 85, color: '#71a4ff', icon: 'cloud' },
  { x: 180, y: 555, color: '#d58acf', icon: 'folder' },
  { x: 600, y: 555, color: '#65d4c5', icon: 'music' },
] as const

function drawIcon(ctx: CanvasRenderingContext2D, icon: string) {
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const path = (points: number[][]) => {
    ctx.beginPath()
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.stroke()
  }
  if (icon === 'search') {
    ctx.beginPath()
    ctx.arc(-5, -5, 17, 0, Math.PI * 2)
    ctx.stroke()
    path([
      [8, 8],
      [25, 25],
    ])
  } else if (icon === 'image') {
    ctx.strokeRect(-26, -22, 52, 44)
    path([
      [-21, 15],
      [-9, 0],
      [2, 10],
      [10, 3],
      [22, 17],
    ])
    ctx.beginPath()
    ctx.arc(13, -11, 4, 0, Math.PI * 2)
    ctx.stroke()
  } else if (icon === 'video') {
    ctx.strokeRect(-27, -23, 54, 46)
    path([
      [-27, -15],
      [27, -15],
    ])
    path([
      [-27, 15],
      [27, 15],
    ])
    for (let x = -17; x < 27; x += 11) {
      path([
        [x, -23],
        [x, -15],
      ])
      path([
        [x, 15],
        [x, 23],
      ])
    }
    ctx.beginPath()
    ctx.moveTo(-5, -9)
    ctx.lineTo(10, 0)
    ctx.lineTo(-5, 9)
    ctx.closePath()
    ctx.fill()
  } else if (icon === 'shield') {
    ctx.beginPath()
    ctx.moveTo(0, -28)
    ctx.quadraticCurveTo(12, -19, 25, -17)
    ctx.quadraticCurveTo(26, 15, 0, 29)
    ctx.quadraticCurveTo(-26, 15, -25, -17)
    ctx.quadraticCurveTo(-12, -19, 0, -28)
    ctx.stroke()
    ctx.strokeRect(-8, -3, 16, 15)
    ctx.beginPath()
    ctx.arc(0, -3, 5, Math.PI, 0)
    ctx.stroke()
  } else if (icon === 'cloud') {
    ctx.beginPath()
    ctx.moveTo(-17, 16)
    ctx.bezierCurveTo(-37, 16, -36, -8, -19, -9)
    ctx.bezierCurveTo(-17, -32, 17, -32, 20, -9)
    ctx.bezierCurveTo(39, -9, 38, 16, 20, 16)
    ctx.closePath()
    ctx.stroke()
  } else if (icon === 'folder') {
    path([
      [-27, 21],
      [-27, -20],
      [-7, -20],
      [0, -12],
      [27, -12],
      [27, 21],
      [-27, 21],
    ])
    path([
      [-27, -4],
      [27, -4],
    ])
  } else if (icon === 'music') {
    path([
      [-9, 15],
      [-9, -19],
      [22, -25],
      [22, 9],
    ])
    path([
      [-9, -9],
      [22, -15],
    ])
    for (const [x, y] of [
      [-16, 17],
      [15, 11],
    ]) {
      ctx.beginPath()
      ctx.ellipse(x, y, 8, 6, -0.25, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    ctx.beginPath()
    ctx.ellipse(0, -18, 22, 8, 0, 0, Math.PI * 2)
    ctx.stroke()
    path([
      [-22, -18],
      [-22, 18],
    ])
    path([
      [22, -18],
      [22, 18],
    ])
    for (const y of [0, 12, 18]) {
      ctx.beginPath()
      ctx.ellipse(0, y, 22, 8, 0, 0, Math.PI)
      ctx.stroke()
    }
  }
}

export function AiNetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let width = 0
    let height = 0
    let elapsed = 0
    let previous = 0
    const circle = (x: number, y: number, r: number) => {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
    }
    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      const scale = Math.min(width / 780, height / 700)
      ctx.translate((width - 780 * scale) / 2, (height - 700 * scale) / 2)
      ctx.scale(scale, scale)
      const glow = ctx.createRadialGradient(390, 365, 40, 390, 365, 290)
      glow.addColorStop(0, '#4c70d51c')
      glow.addColorStop(1, '#4c70d500')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, 780, 700)
      const gradient = ctx.createLinearGradient(170, 180, 600, 540)
      gradient.addColorStop(0, '#36cbb8')
      gradient.addColorStop(0.5, '#6881e3')
      gradient.addColorStop(1, '#ab7ee5')
      for (const [index, radius] of [135, 190].entries()) {
        ctx.save()
        ctx.translate(390, 365)
        ctx.rotate(time * (index ? -0.035 : 0.06))
        ctx.strokeStyle = gradient
        ctx.globalAlpha = 0.45
        ctx.lineWidth = 1
        ctx.setLineDash(index ? [2, 7] : [])
        circle(0, 0, radius)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 0.9
        ctx.fillStyle = index ? '#ab7ee5' : '#36cbb8'
        circle(radius, 0, 4)
        ctx.fill()
        ctx.restore()
      }
      nodes.forEach((node, i) => {
        const dx = node.x - 390,
          dy = node.y - 365,
          distance = Math.hypot(dx, dy)
        const start = 60 / distance,
          end = 1 - 31 / distance
        ctx.strokeStyle = node.color
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.35
        ctx.beginPath()
        ctx.moveTo(390 + dx * start, 365 + dy * start)
        ctx.lineTo(390 + dx * end, 365 + dy * end)
        ctx.stroke()
        ctx.globalAlpha = 1
        for (let j = 0; j < 2; j++) {
          const phase = (time * 0.2 + i * 0.19 + j * 0.5) % 1
          const position = start + (end - start) * phase
          ctx.save()
          ctx.fillStyle = node.color
          circle(390 + dx * position, 365 + dy * position, 2.5)
          ctx.fill()
          ctx.restore()
        }
        ctx.save()
        ctx.translate(node.x, node.y)
        const pulse = 0.5 + 0.5 * Math.sin(time * 1.4 + i)
        ctx.fillStyle = '#1c212a'
        circle(0, 0, 31)
        ctx.fill()
        ctx.strokeStyle = node.color
        ctx.globalAlpha = 0.65 + pulse * 0.25
        ctx.lineWidth = 2
        ctx.stroke()
        // Crisp, tiny stars instead of blurred shadows around the icons.
        for (let star = 0; star < 4; star++) {
          const angle = i * 0.8 + star * Math.PI * 0.5
          const radius = 36 + (star % 2) * 7
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const sparkle = Math.pow(0.5 + 0.5 * Math.sin(time * 1.8 + i * 1.7 + star * 2.3), 4)
          ctx.globalAlpha = 0.15 + sparkle * 0.85
          ctx.fillStyle = sparkle > 0.7 ? '#eafaff' : node.color
          circle(x, y, 0.7 + sparkle * 0.9)
          ctx.fill()
          if (sparkle > 0.65) {
            const length = 1.5 + sparkle * 2
            ctx.strokeStyle = node.color
            ctx.lineWidth = 0.7
            ctx.beginPath()
            ctx.moveTo(x - length, y)
            ctx.lineTo(x + length, y)
            ctx.moveTo(x, y - length)
            ctx.lineTo(x, y + length)
            ctx.stroke()
          }
        }
        ctx.scale(0.55, 0.55)
        ctx.globalAlpha = 0.9
        ctx.strokeStyle = node.color
        ctx.fillStyle = node.color
        drawIcon(ctx, node.icon)
        ctx.restore()
      })
      ctx.fillStyle = '#1a202b'
      circle(390, 365, 60)
      ctx.fill()
      ctx.strokeStyle = gradient
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.globalAlpha = 0.12
      circle(390, 365, 51)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = gradient
      ctx.font = '600 46px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('AI', 390, 368)
      ctx.restore()
    }
    const tick = (now: number) => {
      elapsed += previous ? Math.min((now - previous) / 1000, 0.05) : 0
      previous = now
      draw(elapsed)
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      previous = 0
      if (!width || !height) return
      draw(motion.matches ? 0 : elapsed)
      if (!motion.matches && !document.hidden) frame = requestAnimationFrame(tick)
    }
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sync()
    })
    observer.observe(canvas)
    motion.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      motion.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])
  return <canvas ref={ref} aria-hidden="true" className="aspect-[780/700] w-[92%] max-w-200" />
}
