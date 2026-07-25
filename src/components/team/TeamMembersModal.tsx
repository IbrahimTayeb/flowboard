import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button, IconButton } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Avatar'
import type { TeamMember } from '@/lib/types'

interface TeamMembersModalProps {
  open: boolean
  onClose: () => void
  members: TeamMember[]
  onAdd: (name: string) => Promise<void>
  onRemove: (id: string) => Promise<void>
}

export function TeamMembersModal({ open, onClose, members, onAdd, onRemove }: TeamMembersModalProps) {
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
    <Modal open={open} onClose={onClose} title="Team members" width={440}>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <Input placeholder="Add a team member's name…" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" variant="primary" disabled={submitting || !name.trim()}>
          Add
        </Button>
      </form>

      <div className="flex flex-col gap-1">
        {members.length === 0 && <p className="py-6 text-center text-sm text-(--color-ink-faint)">No team members yet.</p>}
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-(--color-surface-sunken)">
            <div className="flex items-center gap-2.5">
              <Avatar name={m.name} color={m.color} size={28} ring={false} />
              <span className="text-sm font-medium text-(--color-ink)">{m.name}</span>
            </div>
            <IconButton onClick={() => onRemove(m.id)} aria-label={`Remove ${m.name}`}>
              <Trash2 size={14} />
            </IconButton>
          </div>
        ))}
      </div>
    </Modal>
  )
}
