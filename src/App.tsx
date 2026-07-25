import { useMemo, useState } from 'react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import { useLabels } from '@/hooks/useLabels'
import { useUIStore } from '@/store/uiStore'
import { getDueUrgency } from '@/lib/dueDate'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { Header } from '@/components/layout/Header'
import { SetupScreen } from '@/components/layout/SetupScreen'
import { BoardSkeleton } from '@/components/layout/BoardSkeleton'
import { ErrorBanner } from '@/components/layout/ErrorBanner'
import { Board } from '@/components/board/Board'
import { CreateTaskModal } from '@/components/task-form/CreateTaskModal'
import { TaskDetailPanel } from '@/components/task-detail/TaskDetailPanel'
import { TeamMembersModal } from '@/components/team/TeamMembersModal'
import { LabelManagerModal } from '@/components/labels/LabelManagerModal'

function BoardApp() {
  const { userId, loading: authLoading, error: authError } = useAuth()
  const { tasks, loading: tasksLoading, error: tasksError, createTask, updateStatus, updateTask, deleteTask, setAssignees, setLabels, moveLocal } =
    useTasks(userId)
  const { members, addMember, removeMember } = useTeamMembers(userId)
  const { labels, addLabel, removeLabel } = useLabels(userId)

  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [labelsModalOpen, setLabelsModalOpen] = useState(false)

  const {
    search,
    setSearch,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    labelFilter,
    setLabelFilter,
    selectedTaskId,
    setSelectedTaskId,
    createModalOpen,
    createModalDefaultStatus,
    openCreateModal,
    closeCreateModal,
    theme,
    toggleTheme,
    clearFilters,
  } = useUIStore()

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false
      if (priorityFilter && t.priority !== priorityFilter) return false
      if (assigneeFilter && !t.assignee_ids.includes(assigneeFilter)) return false
      if (labelFilter && !t.label_ids.includes(labelFilter)) return false
      return true
    })
  }, [tasks, search, priorityFilter, assigneeFilter, labelFilter])

  const stats = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter((t) => getDueUrgency(t.due_date, t.status) === 'overdue').length,
    }),
    [tasks],
  )

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null
  const hasActiveFilters = Boolean(search || priorityFilter || assigneeFilter || labelFilter)
  const activeError = tasksError && tasksError !== dismissedError ? tasksError : null

  if (!isSupabaseConfigured) {
    return (
      <SetupScreen message="Supabase isn't configured yet. Copy .env.example to .env.local, fill in your project URL and anon key, then restart the dev server." />
    )
  }

  if (authError) {
    return <SetupScreen message={authError} />
  }

  if (authLoading) {
    return <SetupScreen message="Setting up your guest session…" />
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        search={search}
        onSearchChange={setSearch}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        labelFilter={labelFilter}
        onLabelFilterChange={setLabelFilter}
        members={members}
        labels={labels}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        stats={stats}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenTeam={() => setTeamModalOpen(true)}
        onOpenLabels={() => setLabelsModalOpen(true)}
        onNewTask={() => openCreateModal('todo')}
      />

      {activeError && <ErrorBanner message={activeError} onDismiss={() => setDismissedError(activeError)} />}

      <main className="flex-1 overflow-hidden">
        {tasksLoading ? (
          <BoardSkeleton />
        ) : (
          <Board
            tasks={filteredTasks}
            members={members}
            labels={labels}
            onTaskClick={setSelectedTaskId}
            onAddTask={(status) => openCreateModal(status)}
            onMoveLocal={moveLocal}
            onMoveCommit={updateStatus}
          />
        )}
      </main>

      <CreateTaskModal
        open={createModalOpen}
        defaultStatus={createModalDefaultStatus as 'todo' | 'in_progress' | 'in_review' | 'done'}
        members={members}
        labels={labels}
        onClose={closeCreateModal}
        onCreate={async (input) => {
          await createTask(input)
        }}
      />

      <TaskDetailPanel
        task={selectedTask}
        members={members}
        labels={labels}
        userId={userId}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={updateTask}
        onStatusChange={updateStatus}
        onAssigneesChange={setAssignees}
        onLabelsChange={setLabels}
        onDelete={deleteTask}
      />

      <TeamMembersModal
        open={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        members={members}
        onAdd={addMember}
        onRemove={removeMember}
      />

      <LabelManagerModal
        open={labelsModalOpen}
        onClose={() => setLabelsModalOpen(false)}
        labels={labels}
        onAdd={addLabel}
        onRemove={removeLabel}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BoardApp />
    </AuthProvider>
  )
}

export default App
