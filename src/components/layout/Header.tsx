import { LayoutGrid, Moon, Plus, Search, Sun, Tag, Users, X } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { AvatarStack } from '@/components/ui/Avatar'
import type { Label, TaskPriority, TeamMember } from '@/lib/types'

interface HeaderProps {
  search: string
  onSearchChange: (v: string) => void
  priorityFilter: TaskPriority | null
  onPriorityFilterChange: (v: TaskPriority | null) => void
  assigneeFilter: string | null
  onAssigneeFilterChange: (v: string | null) => void
  labelFilter: string | null
  onLabelFilterChange: (v: string | null) => void
  members: TeamMember[]
  labels: Label[]
  hasActiveFilters: boolean
  onClearFilters: () => void
  stats: { total: number; completed: number; overdue: number }
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenTeam: () => void
  onOpenLabels: () => void
  onNewTask: () => void
}

export function Header({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  labelFilter,
  onLabelFilterChange,
  members,
  labels,
  hasActiveFilters,
  onClearFilters,
  stats,
  theme,
  onToggleTheme,
  onOpenTeam,
  onOpenLabels,
  onNewTask,
}: HeaderProps) {
  return (
    <header className="border-b border-(--color-border) bg-(--color-surface)/80 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-3 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <LayoutGrid size={17} />
          </div>
          <div>
            <h1 className="font-display text-[15px] font-semibold leading-none text-(--color-ink)">Flowboard</h1>
          </div>
        </div>

        <div className="ml-1 flex items-center gap-3 text-xs text-(--color-ink-muted)">
          <span>
            <strong className="text-(--color-ink)">{stats.total}</strong> tasks
          </span>
          <span className="h-3 w-px bg-(--color-border)" />
          <span>
            <strong className="text-success-500">{stats.completed}</strong> done
          </span>
          <span className="h-3 w-px bg-(--color-border)" />
          <span>
            <strong className={stats.overdue > 0 ? 'text-danger-500' : 'text-(--color-ink)'}>{stats.overdue}</strong> overdue
          </span>
        </div>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <div className="relative w-full max-w-[220px]">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-(--color-ink-faint)" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks…"
              className="h-9 w-full rounded-lg border border-(--color-border-strong) bg-(--color-surface) pl-8 pr-3 text-sm text-(--color-ink) outline-none placeholder:text-(--color-ink-faint) focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/40"
            />
          </div>

          <Select
            className="!h-9 w-[110px]"
            value={priorityFilter ?? ''}
            onChange={(e) => onPriorityFilterChange((e.target.value || null) as TaskPriority | null)}
          >
            <option value="">Priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </Select>

          <Select
            className="!h-9 w-[130px]"
            value={assigneeFilter ?? ''}
            onChange={(e) => onAssigneeFilterChange(e.target.value || null)}
          >
            <option value="">Assignee</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>

          <Select className="!h-9 w-[120px]" value={labelFilter ?? ''} onChange={(e) => onLabelFilterChange(e.target.value || null)}>
            <option value="">Label</option>
            {labels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>

          {hasActiveFilters && (
            <IconButton onClick={onClearFilters} aria-label="Clear filters">
              <X size={15} />
            </IconButton>
          )}

          <span className="mx-1 h-6 w-px bg-(--color-border)" />

          <button onClick={onOpenTeam} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-(--color-surface-sunken)">
            <Users size={15} className="text-(--color-ink-muted)" />
            <AvatarStack people={members} size={22} />
          </button>

          <IconButton onClick={onOpenLabels} aria-label="Manage labels">
            <Tag size={15} />
          </IconButton>

          <IconButton onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </IconButton>

          <Button variant="primary" icon={<Plus size={15} />} onClick={onNewTask}>
            New task
          </Button>
        </div>
      </div>
    </header>
  )
}
