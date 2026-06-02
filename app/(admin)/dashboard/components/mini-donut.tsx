export const MiniDonut = ({ percent, color, value }: { percent: number; color: string; value: string }) => {
  return (
    <div
      className="grid size-14 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(${color} ${percent}%, var(--app-hover) 0)` }}
      aria-label={`当前负载 ${percent}%`}
    >
      <div className="bg-app-bg grid size-12 place-items-center rounded-full">
        <span className="text-app-text text-xs font-semibold">{value}</span>
      </div>
    </div>
  )
}
