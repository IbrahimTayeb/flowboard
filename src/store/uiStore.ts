import { create } from 'zustand'
import type { TaskPriority } from '@/lib/types'

interface UIState {
  search: string
  setSearch: (v: string) => void

  priorityFilter: TaskPriority | null
  setPriorityFilter: (v: TaskPriority | null) => void

  assigneeFilter: string | null
  setAssigneeFilter: (v: string | null) => void

  labelFilter: string | null
  setLabelFilter: (v: string | null) => void

  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void

  createModalOpen: boolean
  createModalDefaultStatus: string
  openCreateModal: (status?: string) => void
  closeCreateModal: () => void

  teamPanelOpen: boolean
  setTeamPanelOpen: (v: boolean) => void

  theme: 'light' | 'dark'
  toggleTheme: () => void

  clearFilters: () => void
}

const storedTheme = typeof window !== 'undefined' ? (localStorage.getItem('kanban-theme') as 'light' | 'dark' | null) : null
const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
const initialTheme: 'light' | 'dark' = storedTheme ?? (prefersDark ? 'dark' : 'light')

if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', initialTheme === 'dark')
}

export const useUIStore = create<UIState>((set, get) => ({
  search: '',
  setSearch: (v) => set({ search: v }),

  priorityFilter: null,
  setPriorityFilter: (v) => set({ priorityFilter: v }),

  assigneeFilter: null,
  setAssigneeFilter: (v) => set({ assigneeFilter: v }),

  labelFilter: null,
  setLabelFilter: (v) => set({ labelFilter: v }),

  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  createModalOpen: false,
  createModalDefaultStatus: 'todo',
  openCreateModal: (status = 'todo') => set({ createModalOpen: true, createModalDefaultStatus: status }),
  closeCreateModal: () => set({ createModalOpen: false }),

  teamPanelOpen: false,
  setTeamPanelOpen: (v) => set({ teamPanelOpen: v }),

  theme: initialTheme,
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('kanban-theme', next)
    set({ theme: next })
  },

  clearFilters: () => set({ search: '', priorityFilter: null, assigneeFilter: null, labelFilter: null }),
}))
