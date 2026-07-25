import { AlertTriangle, X } from 'lucide-react'

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-xl border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-600 dark:bg-danger-500/10">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss">
          <X size={15} />
        </button>
      )}
    </div>
  )
}
