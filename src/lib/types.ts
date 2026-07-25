export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high'

export interface TeamMember {
  id: string
  user_id: string
  name: string
  color: string
  avatar_url: string | null
  created_at: string
}

export interface Label {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
  assignee_ids: string[]
  label_ids: string[]
  comment_count: number
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  author_name: string
  body: string
  created_at: string
}

export type ActivityType =
  | 'created'
  | 'status_change'
  | 'edited'
  | 'assigned'
  | 'unassigned'
  | 'label_added'
  | 'label_removed'
  | 'comment_added'

export interface ActivityEntry {
  id: string
  task_id: string
  user_id: string
  type: ActivityType
  detail: string
  created_at: string
}

export const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done']

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}
