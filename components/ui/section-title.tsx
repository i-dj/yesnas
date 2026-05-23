import { cn } from '@/lib/utils'

interface SectionTitleProps {
  title: string
  subTitle?: string
}
export const SectionTitle = ({ title, subTitle }: SectionTitleProps) => {
  return (
    <section className="space-y-1.5 pb-2">
      <h2 className="text-app-text text-base font-semibold">{title}</h2>
      {subTitle && <p className="text-app-text-muted text-xs">{subTitle}</p>}
    </section>
  )
}
