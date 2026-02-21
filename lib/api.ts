import { CalendarEvent, CreateEventRequest, UpdateEventRequest } from '@/lib/models/event'

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export const eventsApi = {
  // Récupérer tous les événements avec filtres
  async getEvents(filters?: { 
    startDate?: Date; 
    endDate?: Date; 
    type?: string;
    status?: string;
    client?: string;
    projectId?: string;
  }): Promise<CalendarEvent[]> {
    const params = new URLSearchParams()
    
    if (filters?.startDate) {
      params.append('startDate', filters.startDate.toISOString())
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate.toISOString())
    }
    if (filters?.type) {
      params.append('type', filters.type)
    }
    if (filters?.status) {
      params.append('status', filters.status)
    }
    if (filters?.client) {
      params.append('client', filters.client)
    }
    if (filters?.projectId) {
      params.append('projectId', filters.projectId)
    }

    const response = await fetch(`${API_BASE_URL}/api/events?${params}`)
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des événements')
    }

    const result: ApiResponse<CalendarEvent[]> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur inconnue')
    }

    return (result.data || []).map(event => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
      recurring: event.recurring ? {
        ...event.recurring,
        endDate: event.recurring.endDate ? new Date(event.recurring.endDate) : undefined
      } : undefined
    }))
  },

  // Récupérer un événement par ID
  async getEvent(id: string): Promise<CalendarEvent> {
    const response = await fetch(`${API_BASE_URL}/api/events/${id}`)
    
    if (!response.ok) {
      throw new Error('Événement non trouvé')
    }

    const result: ApiResponse<CalendarEvent> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur inconnue')
    }

    if (!result.data) {
      throw new Error('Événement non trouvé')
    }

    return {
      ...result.data,
      start: new Date(result.data.start),
      end: new Date(result.data.end),
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
      recurring: result.data.recurring ? {
        ...result.data.recurring,
        endDate: result.data.recurring.endDate ? new Date(result.data.recurring.endDate) : undefined
      } : undefined
    }
  },

  // Créer un nouvel événement
  async createEvent(eventData: CreateEventRequest): Promise<CalendarEvent> {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })

    const result: ApiResponse<CalendarEvent> = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur lors de la création de l\'événement')
    }

    if (!result.data) {
      throw new Error('Aucune donnée retournée')
    }

    return {
      ...result.data,
      start: new Date(result.data.start),
      end: new Date(result.data.end),
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
      recurring: result.data.recurring ? {
        ...result.data.recurring,
        endDate: result.data.recurring.endDate ? new Date(result.data.recurring.endDate) : undefined
      } : undefined
    }
  },

  // Mettre à jour un événement
  async updateEvent(id: string, eventData: UpdateEventRequest): Promise<CalendarEvent> {
    const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })

    const result: ApiResponse<CalendarEvent> = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur lors de la mise à jour de l\'événement')
    }

    if (!result.data) {
      throw new Error('Aucune donnée retournée')
    }

    return {
      ...result.data,
      start: new Date(result.data.start),
      end: new Date(result.data.end),
      createdAt: new Date(result.data.createdAt),
      updatedAt: new Date(result.data.updatedAt),
      recurring: result.data.recurring ? {
        ...result.data.recurring,
        endDate: result.data.recurring.endDate ? new Date(result.data.recurring.endDate) : undefined
      } : undefined
    }
  },

  // Supprimer un événement
  async deleteEvent(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
      method: 'DELETE',
    })

    const result: ApiResponse<null> = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Erreur lors de la suppression de l\'événement')
    }
  }
}