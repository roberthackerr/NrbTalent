"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Bug, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface DebugInfo {
  sessionAuth: {
    exists: boolean
    userId?: string
    email?: string
  }
  sessionDB: {
    exists: boolean
    count: number
    sessions: any[]
  }
  check: {
    status: number
    active: boolean
    sessionId?: string
    autoCreated?: boolean
    reason?: string
  }
}

export function SessionDebugPanel() {
  const { data: session, status } = useSession()
  const [debug, setDebug] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostic = async () => {
    setLoading(true)
    try {
      const debugInfo: DebugInfo = {
        sessionAuth: {
          exists: !!session,
          userId: session?.user?.id,
          email: session?.user?.email
        },
        sessionDB: {
          exists: false,
          count: 0,
          sessions: []
        },
        check: {
          status: 0,
          active: false
        }
      }

      // 1. Vérifier les sessions en DB
      const sessionsRes = await fetch('/api/users/sessions')
      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        debugInfo.sessionDB = {
          exists: data.sessions.length > 0,
          count: data.sessions.length,
          sessions: data.sessions
        }
      }

      // 2. Vérifier le check endpoint
      const checkRes = await fetch('/api/users/sessions/check', {
        method: 'POST'
      })
      const checkData = await checkRes.json()
      debugInfo.check = {
        status: checkRes.status,
        active: checkData.active,
        sessionId: checkData.sessionId,
        autoCreated: checkData.autoCreated,
        reason: checkData.reason
      }

      setDebug(debugInfo)
      
      if (checkData.autoCreated) {
        toast.success("Session créée automatiquement!")
      }
      
    } catch (error) {
      console.error("Erreur diagnostic:", error)
      toast.error("Erreur lors du diagnostic")
    } finally {
      setLoading(false)
    }
  }

  const forceCreateSession = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users/sessions', {
        method: 'POST'
      })
      
      if (res.ok) {
        const data = await res.json()
        toast.success(`Session ${data.action}: ${data.sessionId}`)
        runDiagnostic()
      } else {
        throw new Error('Échec création session')
      }
    } catch (error) {
      toast.error("Erreur création session")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      runDiagnostic()
    }
  }, [status])

  if (status !== "authenticated") {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <p className="text-amber-800">Connectez-vous pour voir le debug</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Bug className="h-5 w-5" />
          Session Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostic}
            disabled={loading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Relancer le diagnostic
          </Button>
          
          <Button 
            onClick={forceCreateSession}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            Forcer création session
          </Button>
        </div>

        {/* Résultats */}
        {debug && (
          <div className="space-y-3">
            {/* NextAuth Session */}
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">NextAuth Session</h4>
                {debug.sessionAuth.exists ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="text-xs space-y-1 text-slate-600">
                <div>Status: <Badge variant="outline">{status}</Badge></div>
                <div>User ID: <code className="bg-slate-100 px-1 rounded">{debug.sessionAuth.userId || 'N/A'}</code></div>
                <div>Email: {debug.sessionAuth.email || 'N/A'}</div>
              </div>
            </div>

            {/* Sessions en DB */}
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">Sessions en Base de Données</h4>
                {debug.sessionDB.exists ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="text-xs space-y-1 text-slate-600">
                <div>Nombre: <Badge>{debug.sessionDB.count}</Badge></div>
                {debug.sessionDB.sessions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {debug.sessionDB.sessions.map((sess, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-slate-200 px-1 rounded">
                            {sess.id?.substring(0, 12)}...
                          </code>
                          {sess.current && <Badge variant="default" className="text-xs">Current</Badge>}
                          {sess.active ? (
                            <Badge variant="outline" className="text-green-600 text-xs">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 text-xs">Inactive</Badge>
                          )}
                        </div>
                        <div className="text-slate-500">
                          {sess.device.browser} • {sess.device.os} • {sess.device.device}
                        </div>
                        <div className="text-slate-400 mt-1">
                          Dernière activité: {new Date(sess.lastActive).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Check Endpoint */}
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">Check Endpoint</h4>
                {debug.check.active ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="text-xs space-y-1 text-slate-600">
                <div>Status HTTP: <Badge variant="outline">{debug.check.status}</Badge></div>
                <div>Active: <Badge variant={debug.check.active ? "default" : "destructive"}>{debug.check.active ? 'Oui' : 'Non'}</Badge></div>
                {debug.check.sessionId && (
                  <div>Session ID: <code className="bg-slate-100 px-1 rounded">{debug.check.sessionId}</code></div>
                )}
                {debug.check.autoCreated && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Session auto-créée</span>
                  </div>
                )}
                {debug.check.reason && (
                  <div>Raison: <Badge variant="outline">{debug.check.reason}</Badge></div>
                )}
              </div>
            </div>

            {/* Diagnostic */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">Diagnostic</h4>
              <div className="text-xs space-y-1 text-blue-800">
                {debug.sessionAuth.exists && debug.check.active ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>✅ Tout fonctionne correctement!</span>
                  </div>
                ) : debug.sessionAuth.exists && !debug.check.active ? (
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>⚠️ Session NextAuth OK mais session DB inactive</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-4 w-4" />
                    <span>❌ Problème de session détecté</span>
                  </div>
                )}
                
                {debug.sessionDB.count === 0 && debug.sessionAuth.exists && (
                  <div className="mt-2 p-2 bg-amber-100 rounded border border-amber-300 text-amber-800">
                    <p className="font-semibold mb-1">Action requise:</p>
                    <p>Aucune session trouvée en DB. Cliquez sur "Forcer création session"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Agent Info */}
        <div className="p-3 bg-slate-50 rounded-lg border text-xs">
          <h4 className="font-semibold text-sm mb-2">User Agent</h4>
          <code className="text-xs break-all text-slate-600">
            {navigator.userAgent}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}