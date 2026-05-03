interface StatusTabLabelProps {
  label: string
  count?: number
}

export const StatusTabLabel = ({ label, count }: StatusTabLabelProps) => (
  <div className="flex items-center gap-2 px-1">
    <span className="text-[14px] font-medium">{label}</span>
    {count !== undefined && (
      <span className="bg-app-item-bg text-app-text-muted min-w-5 rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors">
        {count}
      </span>
    )}
  </div>
)
