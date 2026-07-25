import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button, IconButton } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { DotBadge } from '@/components/ui/Badge'
import type { Label } from '@/lib/types'

interface LabelManagerModalProps {
  open: boolean
  onClose: () => void
  labels: Label[]
  onAdd: (name: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export function LabelManagerModal({ open, onClose, labels, onAdd, onRemove }: LabelManagerModalProps) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    await onAdd(name.trim())
    setName('')
    setSubmitting(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="Labels" width={420}>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <Input placeholder="e.g. Bug, Feature, Design…" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" variant="primary" disabled={submitting || !name.trim()}>
          Add
        </Button>
      </form>

      <div className="flex flex-col gap-1">
        {labels.length === 0 && <p className="py-6 text-center text-sm text-(--color-ink-faint)">No labels yet.</p>}
        {labels.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-(--color-surface-sunken)">
            <DotBadge color={l.color}>{l.name}</DotBadge>
            <IconButton onClick={() => onRemove(l.id)} aria-label={`Remove ${l.name}`}>
              <Trash2 size={14} />
            </IconButton>
          </div>
        ))}
      </div>
    </Modal>
  )
}
