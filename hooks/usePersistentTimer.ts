// hooks/usePersistentTimer.ts
import { useState, useEffect, useRef, useCallback } from 'react'

interface PersistentTimerState {
  taskId: string
  startTime: string
  description: string
  entryId?: string
}

export function usePersistentTimer() {
  const [activeTimer, setActiveTimer] = useState<{
    taskId: string
    startTime: Date
    description: string
    entryId?: string
  } | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Charger le timer depuis localStorage au démarrage
  useEffect(() => {
    const savedTimer = localStorage.getItem('activeTimer')
    if (savedTimer) {
      try {
        const timer: PersistentTimerState = JSON.parse(savedTimer)
        setActiveTimer({
          ...timer,
          startTime: new Date(timer.startTime)
        })
      } catch (error) {
        console.error('Error loading saved timer:', error)
        localStorage.removeItem('activeTimer')
      }
    }
  }, [])

  // Sauvegarder le timer dans localStorage à chaque changement
  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('activeTimer', JSON.stringify({
        taskId: activeTimer.taskId,
        startTime: activeTimer.startTime.toISOString(),
        description: activeTimer.description,
        entryId: activeTimer.entryId
      }))
    } else {
      localStorage.removeItem('activeTimer')
    }
  }, [activeTimer])

  // Mettre à jour le temps écoulé
  useEffect(() => {
    if (activeTimer) {
      // Calculer le temps écoulé depuis le début
      const updateElapsedTime = () => {
        const elapsed = Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }
      
      updateElapsedTime()
      intervalRef.current = setInterval(updateElapsedTime, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setElapsedTime(0)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activeTimer])

  const startTimer = useCallback((taskId: string, description: string, entryId?: string) => {
    setActiveTimer({
      taskId,
      startTime: new Date(),
      description,
      entryId
    })
  }, [])

  const stopTimer = useCallback(() => {
    const timer = activeTimer
    setActiveTimer(null)
    return timer
  }, [activeTimer])

  const updateTimerEntryId = useCallback((entryId: string) => {
    setActiveTimer(prev => prev ? { ...prev, entryId } : null)
  }, [])

  return {
    activeTimer,
    elapsedTime,
    startTimer,
    stopTimer,
    updateTimerEntryId
  }
}