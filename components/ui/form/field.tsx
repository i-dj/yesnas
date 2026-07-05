import { ReactNode } from 'react'

interface FieldProps {
  label: string
  extra?: ReactNode
  children: ReactNode
}

export const Field = ({ label, extra, children }: FieldProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-5 items-center justify-start gap-2">
        <span className="text-app-text-muted text-sm">{label}</span>
        {extra ? <span className="inline-flex h-5 shrink-0 items-center">{extra}</span> : null}
      </div>
      {children}
    </div>
  )
}
