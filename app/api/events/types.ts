export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface EventsFilter {
  startDate?: string
  endDate?: string
  type?: string
  status?: string
  client?: string
  projectId?: string
}