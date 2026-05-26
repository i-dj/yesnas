declare module 'react-avatar-editor' {
  import type { ComponentType, CSSProperties, Ref } from 'react'

  export interface AvatarEditorRef {
    getImage(): HTMLCanvasElement
    getImageScaledToCanvas(): HTMLCanvasElement
  }

  export interface AvatarEditorProps {
    image: string | File
    width?: number
    height?: number
    border?: number | [number, number]
    borderRadius?: number
    color?: [number, number, number, number]
    scale?: number
    rotate?: number
    className?: string
    style?: CSSProperties
    crossOrigin?: '' | 'anonymous' | 'use-credentials'
    disableBoundaryChecks?: boolean
    disableHiDPIScaling?: boolean
    onImageReady?: () => void
    onImageChange?: () => void
    onLoadFailure?: () => void
    onLoadSuccess?: () => void
    onMouseUp?: () => void
    onMouseMove?: () => void
    onPositionChange?: (position: { x: number; y: number }) => void
  }

  const AvatarEditor: ComponentType<AvatarEditorProps & { ref?: Ref<AvatarEditorRef> }>
  export default AvatarEditor
}
