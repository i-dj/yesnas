'use client'

import { Card } from '@/components/ui'

interface InfoItem {
  label: string
  value: string | number
}

interface InfoCardProps {
  title: string
  items?: InfoItem[] // Optional; falls back to an empty state when omitted
}

export const InfoCard = ({ title, items }: InfoCardProps) => {
  return (
    <Card className="flex-1" title={title}>
      {items ? (
        <ul className="flex flex-col gap-1 text-sm">
          {items.map((item) => (
            <li
              key={item.label}
              className="flex justify-between border-b border-dashed border-neutral-300 px-1 py-2"
            >
              <span className="text-neutral-600">{item.label}</span>
              <span>{item.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div>Empty</div>
      )}
    </Card>
  )
}
