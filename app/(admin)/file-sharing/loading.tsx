export default function FileSharingLoading() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="bg-app-hover h-8 w-40 animate-pulse rounded" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-app-hover h-40 animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="bg-app-hover h-72 animate-pulse rounded-lg" />
    </div>
  )
}
