'use client'

import { Button } from '@/components/ui'
import { Minus, Plus, RotateCcw, RotateCw } from 'lucide-react'
import type { WheelEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import AvatarEditor, { type AvatarEditorRef } from 'react-avatar-editor'

interface AvatarEditorLabels {
  cancel: string
  confirm: string
  zoom: string
  zoomIn: string
  zoomOut: string
  rotateLeft: string
  rotateRight: string
}

interface AvatarEditorModalProps {
  image: string | File | null
  labels: AvatarEditorLabels
  onCancel: () => void
  onConfirm: (dataUrl: string) => void
}

const clampScale = (value: number) => Math.max(1, Math.min(3, Number(value.toFixed(2))))

export function AvatarEditorModal({ image, labels, onCancel, onConfirm }: AvatarEditorModalProps) {
  const [mounted, setMounted] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const editorRef = useRef<AvatarEditorRef>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!image) return
    setScale(1)
    setRotate(0)
  }, [image])

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    setScale((value) => clampScale(value + (event.deltaY < 0 ? 0.08 : -0.08)))
  }

  const handleConfirm = () => {
    const canvas = editorRef.current?.getImageScaledToCanvas()
    if (!canvas) return
    onConfirm(canvas.toDataURL('image/png'))
  }

  if (!mounted || !image) return null

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="bg-app-bg border-app-border w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl">
        <div className="flex min-h-80 items-center justify-center p-6" onWheel={handleWheel}>
          <AvatarEditor
            ref={editorRef}
            image={image}
            border={48}
            borderRadius={140}
            color={[0, 0, 0, 0.48]}
            scale={scale}
            rotate={rotate}
            className="max-w-full"
          />
        </div>

        <div className="border-app-border flex flex-col gap-4 border-t p-5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              icon={RotateCcw}
              onClick={() => setRotate((value) => value - 90)}
              tip={labels.rotateLeft}
            />
            <Button
              type="button"
              variant="secondary"
              icon={RotateCw}
              onClick={() => setRotate((value) => value + 90)}
              tip={labels.rotateRight}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={onCancel}>
              {labels.cancel}
            </Button>
            <Button type="button" onClick={handleConfirm}>
              {labels.confirm}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
