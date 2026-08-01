export type TaskId = 'task_garden' | 'task_eat' | 'task_sleep' | 'task_water' | 'task_sport'
export type TaskStatus = 'pending' | 'done' | 'makeup' | 'skipped'

export interface CheckinTask {
  id: TaskId
  status: TaskStatus
  content?: string
}

export interface DailyCheckin {
  date: string
  tasks: CheckinTask[]
  all_completed: boolean
}

export interface CheckinCalendarDay {
  date: string
  completed: boolean
  isMakeup: boolean
}
