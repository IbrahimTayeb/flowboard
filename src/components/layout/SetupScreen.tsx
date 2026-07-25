import { LayoutGrid } from 'lucide-react'

export function SetupScreen({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-(--color-canvas) p-6">
      <div className="w-full max-w-md rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 text-center shadow-(--shadow-card)">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white">
          <LayoutGrid size={22} />
        </div>
        <h1 className="font-display text-lg font-semibold text-(--color-ink)">Almost there</h1>
        <p className="mt-2 text-sm leading-relaxed text-(--color-ink-muted)">{message}</p>
      </div>
    </div>
  )
}
