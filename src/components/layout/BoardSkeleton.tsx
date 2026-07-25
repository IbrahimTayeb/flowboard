const COLUMNS = 4

export function BoardSkeleton() {
  return (
    <div className="flex h-full gap-5 overflow-x-hidden px-6 pb-6 pt-1">
      {Array.from({ length: COLUMNS }).map((_, colIdx) => (
        <div key={colIdx} className="flex w-[300px] shrink-0 flex-col gap-2 sm:w-[320px]">
          <div className="mb-1 h-4 w-24 rounded bg-(--color-surface-sunken)" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="relative h-[92px] overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface-sunken) animate-shimmer"
              style={{ opacity: 1 - i * 0.18 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
