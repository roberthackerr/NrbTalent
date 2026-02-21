// components/projects/AIArchitectBadge.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sparkles, Brain, Lock, Zap, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

interface AIArchitectBadgeProps {
  projectId: string
  clientId?: string
  isProjectOwner?: boolean
  projectTitle?: string
  className?: string
}

export function AIArchitectBadge({ 
  projectId, 
  clientId, 
  isProjectOwner = false,
  projectTitle = '',
  className = '' 
}: AIArchitectBadgeProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [showAccessDialog, setShowAccessDialog] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      if (!session?.user?.id) {
        setHasAccess(false)
        setIsLoading(false)
        return
      }

      try {
        // Vérifier si l'utilisateur actuel est le client propriétaire
        const currentUserId = session.user.id
        const isClientOwner = clientId ? currentUserId === clientId.toString() : isProjectOwner
        const isAdmin = session.user.role === 'admin'
        
        setHasAccess(isClientOwner || isAdmin)
      } catch (error) {
        console.error('Error checking AI Architect access:', error)
        setHasAccess(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [session, clientId, isProjectOwner])

  const handleClick = () => {
    if (!session) {
      // Rediriger vers la connexion si non authentifié
      router.push(`/auth/signin?callbackUrl=/projects/${projectId}/architect`)
      return
    }

    if (hasAccess) {
      router.push(`/projects/${projectId}/architect`)
    } else {
      setShowAccessDialog(true)
    }
  }

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 animate-pulse ${className}`}>
        <div className="w-4 h-4 bg-blue-200 rounded-full"></div>
        <div className="w-20 h-3 bg-blue-200 rounded"></div>
      </div>
    )
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClick}
              className={`group relative overflow-hidden ${hasAccess 
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 hover:shadow-md' 
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              } transition-all duration-300 ${className}`}
            >
              <div className="flex items-center gap-2">
                <div className={`relative ${hasAccess ? 'text-blue-600 group-hover:text-purple-600' : 'text-slate-400'}`}>
                  {hasAccess ? (
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <span className={`font-medium ${hasAccess ? 'text-blue-700 group-hover:text-purple-700' : 'text-slate-500'}`}>
                  AI Architect
                </span>
                
                {/* Badge d'indication d'accès */}
                {hasAccess && (
                  <span className="absolute -top-1 -right-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  </span>
                )}
              </div>
              
              {/* Effet de brillance au survol */}
              {hasAccess && (
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">AI Project Architect</span>
              </div>
              <p className="text-sm text-slate-600">
                {hasAccess 
                  ? 'Générez une analyse complète AI du projet avec roadmap, estimations et recommandations'
                  : 'Accès réservé au client propriétaire du projet'
                }
              </p>
              {hasAccess && (
                <div className="flex items-center gap-1 text-xs text-blue-500">
                  <Zap className="w-3 h-3" />
                  <span>Cliquez pour accéder à l'analyse AI</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Dialog d'accès refusé */}
      <AlertDialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>Accès restreint à l'AI Architect</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p>
                La fonctionnalité <span className="font-semibold text-blue-600">AI Project Architect</span> est uniquement accessible au client propriétaire de ce projet.
              </p>
              
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">Cette fonctionnalité permet :</span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-600 pl-6">
                  <li className="list-disc">Analyse automatique des exigences du projet</li>
                  <li className="list-disc">Roadmap et planification détaillée</li>
                  <li className="list-disc">Estimation des coûts et délais</li>
                  <li className="list-disc">Recommandations techniques et stratégiques</li>
                </ul>
              </div>
              
              <p className="text-sm text-slate-500">
                Si vous êtes le client de ce projet, connectez-vous avec le compte approprié pour y accéder.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fermer</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/auth/signin')}>
              Se connecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Version simplifiée pour les cartes
export function AIArchitectMiniBadge({ projectId, clientId }: { projectId: string, clientId?: string }) {
  const { data: session } = useSession()
  
  const hasAccess = session?.user?.role === 'admin' || 
                   (clientId && session?.user?.id === clientId.toString())

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (hasAccess) {
                window.location.href = `/projects/${projectId}/architect`
              }
            }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              hasAccess 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            disabled={!hasAccess}
          >
            <Sparkles className={`w-3 h-3 ${hasAccess ? 'animate-pulse' : ''}`} />
            AI
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {hasAccess 
            ? 'Analyse AI du projet disponible' 
            : 'AI Architect réservé au client'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}