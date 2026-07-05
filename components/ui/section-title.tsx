interface SectionTitleProps {
  title: string
  subTitle?: string
  level?: 'page' | 'section'
}
export const SectionTitle = ({ title, subTitle, level = 'page' }: SectionTitleProps) => {
  return (
    <section className="space-y-1.5 pb-2">
      <div className={level === 'page' ? 'app-page-title text-app-text' : 'app-section-title text-app-text'}>
        {title}
      </div>
      {subTitle && <p className="app-body-text text-app-text-muted">{subTitle}</p>}
    </section>
  )
}
