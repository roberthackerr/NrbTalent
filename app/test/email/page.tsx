'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  RefreshCw,
  Home
} from 'lucide-react'

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
  timestamp?: string
  accepted?: string[]
}

export default function EmailTestPage() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<EmailResponse | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('simple')

  // API URL
  const API_URL = process.env.NEXT_PUBLIC_EMAIL_API_URL || 'https://nrb-m.vercel.app'

  // État pour email simple
  const [simpleEmail, setSimpleEmail] = useState({
    to: '',
    subject: 'Email de test NrbTalents',
    html: '<h1>Bienvenue!</h1><p>Ceci est un email de test.</p>',
    text: ''
  })

  // État pour email de bienvenue
  const [welcomeEmail, setWelcomeEmail] = useState({
    to: '',
    userName: 'Jean Dupont',
    activationLink: 'https://app.nrbtalents.com/activate?token=abc123'
  })

  // État pour email de réinitialisation
  const [resetEmail, setResetEmail] = useState({
    to: '',
    resetLink: 'https://app.nrbtalents.com/reset-password?token=xyz789'
  })

  // Vérifier la connexion
  const verifyConnection = async () => {
    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch(`${API_URL}/verify`)
      const data = await res.json()
      setResponse({
        success: data.success,
        message: data.message,
        error: data.error,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      })
    } finally {
      setLoading(false)
    }
  }

  // Envoyer email simple
  const sendSimpleEmail = async () => {
    if (!simpleEmail.to) {
      alert('Veuillez entrer un destinataire')
      return
    }

    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch(`${API_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simpleEmail)
      })
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      })
    } finally {
      setLoading(false)
    }
  }

  // Envoyer email de bienvenue
  const sendWelcomeEmail = async () => {
    if (!welcomeEmail.to) {
      alert('Veuillez entrer un destinataire')
      return
    }

    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch(`${API_URL}/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(welcomeEmail)
      })
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      })
    } finally {
      setLoading(false)
    }
  }

  // Envoyer email de réinitialisation
  const sendResetEmail = async () => {
    if (!resetEmail.to) {
      alert('Veuillez entrer un destinataire')
      return
    }

    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetEmail)
      })
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      })
    } finally {
      setLoading(false)
    }
  }

  // Copier l'ID
  const copyMessageId = (messageId: string) => {
    navigator.clipboard.writeText(messageId)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Remplir avec email test
  const fillTestEmail = (type: string) => {
    const testEmail = 'test@example.com'
    switch(type) {
      case 'simple':
        setSimpleEmail(prev => ({ ...prev, to: testEmail }))
        break
      case 'welcome':
        setWelcomeEmail(prev => ({ ...prev, to: testEmail }))
        break
      case 'reset':
        setResetEmail(prev => ({ ...prev, to: testEmail }))
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold">Test Email Service</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Interface de test pour le service Express + Nodemailer
          </p>
          
          {/* API Info */}
          <div className="mt-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">API:</span>
              <code className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                {API_URL}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={verifyConnection}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Tester connexion
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = API_URL}
              className="text-xs"
            >
              <Home className="w-3 h-3 mr-1" />
              Accueil API
            </Button>
          </div>
        </div>

        {/* Response Alert */}
        {response && (
          <Alert className={`mb-6 ${response.success ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}`}>
            <div className="flex items-start gap-3">
              {response.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${response.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                  {response.success ? '✅ Succès' : '❌ Erreur'}
                </p>
                {response.message && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {response.message}
                  </p>
                )}
                {response.messageId && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <code className="text-sm bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                      {response.messageId}
                    </code>
                    <button
                      onClick={() => copyMessageId(response.messageId!)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
                      title="Copier l'ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {copiedId === response.messageId && (
                      <span className="text-xs text-green-600">Copié!</span>
                    )}
                  </div>
                )}
                {response.accepted && response.accepted.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Accepté: {response.accepted.join(', ')}
                  </p>
                )}
                {response.error && (
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {response.error}
                  </p>
                )}
                {response.timestamp && (
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(response.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Tabs - Correspondant exactement aux routes Express */}
        <Tabs defaultValue="simple" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="simple">📨 /send</TabsTrigger>
            <TabsTrigger value="welcome">👋 /welcome</TabsTrigger>
            <TabsTrigger value="reset">🔑 /reset-password</TabsTrigger>
          </TabsList>

          {/* Tab 1: /send */}
          <TabsContent value="simple" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>POST /send</CardTitle>
                    <CardDescription>
                      Envoyer un email personnalisé
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fillTestEmail('simple')}
                  >
                    Remplir test
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="simple-to">Destinataire *</Label>
                  <Input
                    id="simple-to"
                    type="email"
                    value={simpleEmail.to}
                    onChange={(e) =>
                      setSimpleEmail({ ...simpleEmail, to: e.target.value })
                    }
                    placeholder="user@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="simple-subject">Sujet *</Label>
                  <Input
                    id="simple-subject"
                    value={simpleEmail.subject}
                    onChange={(e) =>
                      setSimpleEmail({ ...simpleEmail, subject: e.target.value })
                    }
                    placeholder="Sujet de l'email"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="simple-html">Contenu HTML *</Label>
                  <Textarea
                    id="simple-html"
                    value={simpleEmail.html}
                    onChange={(e) =>
                      setSimpleEmail({ ...simpleEmail, html: e.target.value })
                    }
                    placeholder="<h1>Titre</h1><p>Contenu...</p>"
                    rows={6}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="simple-text">Version texte (optionnel)</Label>
                  <Textarea
                    id="simple-text"
                    value={simpleEmail.text}
                    onChange={(e) =>
                      setSimpleEmail({ ...simpleEmail, text: e.target.value })
                    }
                    placeholder="Version texte brut"
                    rows={3}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={sendSimpleEmail}
                  disabled={loading || !simpleEmail.to || !simpleEmail.subject || !simpleEmail.html}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer via /send
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: /welcome */}
          <TabsContent value="welcome" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>POST /welcome</CardTitle>
                    <CardDescription>
                      Email de bienvenue pour nouveaux utilisateurs
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fillTestEmail('welcome')}
                  >
                    Remplir test
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="welcome-to">Destinataire *</Label>
                  <Input
                    id="welcome-to"
                    type="email"
                    value={welcomeEmail.to}
                    onChange={(e) =>
                      setWelcomeEmail({ ...welcomeEmail, to: e.target.value })
                    }
                    placeholder="user@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="welcome-name">Nom d'utilisateur</Label>
                  <Input
                    id="welcome-name"
                    value={welcomeEmail.userName}
                    onChange={(e) =>
                      setWelcomeEmail({ ...welcomeEmail, userName: e.target.value })
                    }
                    placeholder="Jean Dupont"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="welcome-link">Lien d'activation (optionnel)</Label>
                  <Input
                    id="welcome-link"
                    value={welcomeEmail.activationLink}
                    onChange={(e) =>
                      setWelcomeEmail({ ...welcomeEmail, activationLink: e.target.value })
                    }
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded">
                  <p className="text-xs font-mono">
                    Template: {`<h1>Bienvenue {userName} !</h1>`}
                  </p>
                </div>

                <Button
                  onClick={sendWelcomeEmail}
                  disabled={loading || !welcomeEmail.to}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer via /welcome
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: /reset-password */}
          <TabsContent value="reset" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>POST /reset-password</CardTitle>
                    <CardDescription>
                      Email de réinitialisation de mot de passe
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fillTestEmail('reset')}
                  >
                    Remplir test
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reset-to">Destinataire *</Label>
                  <Input
                    id="reset-to"
                    type="email"
                    value={resetEmail.to}
                    onChange={(e) =>
                      setResetEmail({ ...resetEmail, to: e.target.value })
                    }
                    placeholder="user@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="reset-link">Lien de réinitialisation *</Label>
                  <Input
                    id="reset-link"
                    value={resetEmail.resetLink}
                    onChange={(e) =>
                      setResetEmail({ ...resetEmail, resetLink: e.target.value })
                    }
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded">
                  <p className="text-xs font-mono">
                    Template: Lien expire dans 24h
                  </p>
                </div>

                <Button
                  onClick={sendResetEmail}
                  disabled={loading || !resetEmail.to || !resetEmail.resetLink}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer via /reset-password
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Box */}
        <Card className="mt-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-base">📋 Routes disponibles</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-slate-900 p-2 rounded">
                <code className="text-xs">GET /</code>
                <p className="text-xs text-slate-500">Status du service</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded">
                <code className="text-xs">GET /verify</code>
                <p className="text-xs text-slate-500">Vérifier connexion Gmail</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded">
                <code className="text-xs">POST /send</code>
                <p className="text-xs text-slate-500">Email personnalisé</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded">
                <code className="text-xs">POST /welcome</code>
                <p className="text-xs text-slate-500">Email de bienvenue</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded">
                <code className="text-xs">POST /reset-password</code>
                <p className="text-xs text-slate-500">Réinitialisation</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Service Express avec Gmail OAuth2 • {new Date().toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}