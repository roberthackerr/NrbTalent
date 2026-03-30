// hooks/useDebounce.ts
import { useState, useEffect } from 'react'

/**
 * Hook personnalisé pour debouncer une valeur
 * @param value - La valeur à debouncer
 * @param delay - Délai en millisecondes (défaut: 500ms)
 * @returns La valeur debouncée
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearchTerm = useDebounce(searchTerm, 300)
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     searchAPI(debouncedSearchTerm)
 *   }
 * }, [debouncedSearchTerm])
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Timer pour mettre à jour la valeur debouncée
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup: annuler le timer si value change avant la fin du délai
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// Version avec callback pour plus de contrôle
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const id = setTimeout(() => {
      callback(...args)
    }, delay)

    setTimeoutId(id)
  }
}

// Version avec promesse (utile pour la recherche)
export function useDebouncedPromise<T>(
  fn: () => Promise<T>,
  delay: number = 500
): () => Promise<T> {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  return () => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      const id = setTimeout(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)

      setTimeoutId(id)
    })
  }
}