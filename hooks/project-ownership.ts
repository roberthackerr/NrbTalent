// hooks/project-ownership.ts
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

/**
 * Hook pour récupérer la session avec gestion d'état
 */
function useSafeSession() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  return { session, isLoading }
}

/**
 * Vérifie si l'utilisateur actuel est le propriétaire d'un projet
 * Ne doit PAS être utilisé conditionnellement
 */
export function useIsProjectOwner(clientId?: string): boolean {
  const { session } = useSafeSession()
  
  if (!session?.user?.id || !clientId) {
    return false
  }
  
  return session.user.id === clientId.toString()
}

/**
 * Vérifie si l'utilisateur a accès à un projet
 * Ne doit PAS être utilisé conditionnellement
 */
export function useHasProjectAccess(clientId?: string, collaborators?: string[]): boolean {
  const { session } = useSafeSession()
  
  if (!session?.user?.id) {
    return false
  }
  
  // Admin a toujours accès
  if (session.user.role === 'admin') {
    return true
  }
  
  // Propriétaire a accès
  if (clientId && session.user.id === clientId.toString()) {
    return true
  }
  
  // Collaborateurs ont accès
  if (collaborators?.some(collabId => collabId === session.user.id)) {
    return true
  }
  
  return false
}

/**
 * Hook principal pour toutes les permissions - UTILISER CELUI-CI
 */
export function useProjectPermissions(clientId?: string, collaborators?: Array<{userId: string, role: string}>) {
  const { session, isLoading } = useSafeSession()
  
  const isOwner = clientId ? session?.user?.id === clientId.toString() : false
  const isAdmin = session?.user?.role === 'admin'
  const hasAccess = isOwner || isAdmin || 
    collaborators?.some(c => c.userId === session?.user?.id) || false
  
  const canEdit = isAdmin || isOwner || 
    collaborators?.some(c => c.userId === session?.user?.id && 
      (c.role === 'editor' || c.role === 'admin')) || false
  
  const canDelete = isAdmin || isOwner
  
  const canAccessAI = isAdmin || isOwner
  
  const collaborator = collaborators?.find(c => c.userId === session?.user?.id)
  
  return {
    // États de chargement
    isLoading,
    
    // Identité
    isOwner,
    isAdmin,
    isCollaborator: !!collaborator,
    
    // Permissions
    hasAccess,
    canEdit,
    canDelete,
    canAccessAI,
    
    // Rôle détaillé
    role: isOwner ? 'owner' : 
          isAdmin ? 'admin' :
          collaborator?.role || 'viewer',
    
    // Utilitaires
    userId: session?.user?.id,
    userName: session?.user?.name,
  }
}

/**
 * Version simplifiée pour les composants
 */
export function useAIAccess(clientId?: string) {
  const permissions = useProjectPermissions(clientId)
  
  return {
    canAccess: permissions.canAccessAI,
    isLoading: permissions.isLoading,
    isOwner: permissions.isOwner,
  }
}

/**
 * Fonctions utilitaires (non-hooks) - à utiliser hors des composants
 */
export const projectUtils = {
  /**
   * Normalise un ID (string ou ObjectId)
   */
  normalizeId: (id: any): string | null => {
    if (!id) return null
    if (typeof id === 'string') return id
    if (id.toString) return id.toString()
    return null
  },
  
  /**
   * Vérifie l'accès côté client (pour usage immédiat)
   */
  checkAccess: (session: any, clientId?: string, collaborators?: string[]): boolean => {
    if (!session?.user?.id) return false
    
    // Admin
    if (session.user.role === 'admin') return true
    
    // Propriétaire
    if (clientId && session.user.id === clientId.toString()) return true
    
    // Collaborateur
    if (collaborators?.some(id => id === session.user.id)) return true
    
    return false
  }
}