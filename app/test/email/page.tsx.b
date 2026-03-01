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
  Copy
} from 'lucide-react'

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
  timestamp?: string
}

export default function EmailTestPage() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<EmailResponse | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // État pour email simple
  const [simpleEmail, setSimpleEmail] = useState({
    to: 'test@example.com',
    subject: 'Email de test NrbTalents',
    html: '<h1>Bienvenue!</h1><p>Ceci est un email de test du service Nodemailer.</p>'
  })

  // État pour email de bienvenue
  const [welcomeEmail, setWelcomeEmail] = useState({
    to: 'test@example.com',
    templateName: 'welcome',
    data: {
      userName: 'Jean Dupont',
      activationLink: 'https://app.nrbtalents.com/activate?token=abc123'
    }
  })

  // État pour email de réinitialisation
  const [resetEmail, setResetEmail] = useState({
    to: 'test@example.com',
    templateName: 'password-reset',
    data: {
      resetLink: 'https://app.nrbtalents.com/reset-password?token=xyz789'
    }
  })

  // État pour email de match projet
  const [projectMatchEmail, setProjectMatchEmail] = useState({
    to: 'test@example.com',
    templateName: 'project-match',
    data: {
      userName: 'Alice Martin',
      projectTitle: 'Développement App React Native',
      projectDescription: 'Créer une application mobile pour gestion de projets',
      projectBudgetMin: 2000,
      projectBudgetMax: 5000,
      projectCurrency: 'MGA',
      projectDeadline: '2025-03-15',
      projectSkills: 'React Native, TypeScript, Firebase',
      projectLink: 'https://app.nrbtalents.com/projects/123',
      hoursToApply: 48
    }
  })

  // Envoyer email simple
  const sendSimpleEmail = async () => {
    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch('https://nrbmailer-production.up.railway.app/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simpleEmail)
      })
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion au service'
      })
    } finally {
      setLoading(false)
    }
  }

  // Envoyer email avec template
  const sendTemplateEmail = async (emailData: any) => {
    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch('https://nrbmailer-production.up.railway.app/api/email/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      })
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion au service'
      })
    } finally {
      setLoading(false)
    }
  }

  // Copier l'ID du message
  const copyMessageId = (messageId: string) => {
    navigator.clipboard.writeText(messageId)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
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
            Testez le service Nodemailer directement à partir d'ici
          </p>
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
                  {response.success ? '✅ Email envoyé avec succès!' : '❌ Erreur lors de l\'envoi'}
                </p>
                {response.messageId && (
                  <div className="mt-2 flex items-center gap-2">
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
                {response.error && (
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {response.error}
                  </p>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="simple" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="simple">Email Simple</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Tab 1: Email Simple */}
          <TabsContent value="simple" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Envoyer un email simple</CardTitle>
                <CardDescription>
                  Composez et envoyez un email personnalisé
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="simple-to">Destinataire</Label>
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
                  <Label htmlFor="simple-subject">Sujet</Label>
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
                  <Label htmlFor="simple-html">Contenu HTML</Label>
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

                <Button
                  onClick={sendSimpleEmail}
                  disabled={loading}
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
                      Envoyer
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Templates */}
          <TabsContent value="templates" className="space-y-4">
            {/* Welcome Template */}
            <Card>
              <CardHeader>
                <CardTitle>✉️ Email de Bienvenue</CardTitle>
                <CardDescription>Template pour les nouveaux utilisateurs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="welcome-to">Destinataire</Label>
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
                    value={welcomeEmail.data.userName}
                    onChange={(e) =>
                      setWelcomeEmail({
                        ...welcomeEmail,
                        data: { ...welcomeEmail.data, userName: e.target.value }
                      })
                    }
                    placeholder="Jean Dupont"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="welcome-link">Lien d'activation</Label>
                  <Input
                    id="welcome-link"
                    value={welcomeEmail.data.activationLink}
                    onChange={(e) =>
                      setWelcomeEmail({
                        ...welcomeEmail,
                        data: { ...welcomeEmail.data, activationLink: e.target.value }
                      })
                    }
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={() => sendTemplateEmail(welcomeEmail)}
                  disabled={loading}
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
                      Envoyer email de bienvenue
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Reset Template */}
            <Card>
              <CardHeader>
                <CardTitle>🔑 Email de Réinitialisation</CardTitle>
                <CardDescription>Template pour réinitialiser le mot de passe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reset-to">Destinataire</Label>
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
                  <Label htmlFor="reset-link">Lien de réinitialisation</Label>
                  <Input
                    id="reset-link"
                    value={resetEmail.data.resetLink}
                    onChange={(e) =>
                      setResetEmail({
                        ...resetEmail,
                        data: { ...resetEmail.data, resetLink: e.target.value }
                      })
                    }
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={() => sendTemplateEmail(resetEmail)}
                  disabled={loading}
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
                      Envoyer email réinitialisation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Project Match Template */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 Email Match Projet</CardTitle>
                <CardDescription>Notification de matching projet pour freelancers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="project-to">Destinataire</Label>
                  <Input
                    id="project-to"
                    type="email"
                    value={projectMatchEmail.to}
                    onChange={(e) =>
                      setProjectMatchEmail({ ...projectMatchEmail, to: e.target.value })
                    }
                    placeholder="user@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="project-name">Nom du freelancer</Label>
                  <Input
                    id="project-name"
                    value={projectMatchEmail.data.userName}
                    onChange={(e) =>
                      setProjectMatchEmail({
                        ...projectMatchEmail,
                        data: { ...projectMatchEmail.data, userName: e.target.value }
                      })
                    }
                    placeholder="Alice Martin"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="project-title">Titre du projet</Label>
                  <Input
                    id="project-title"
                    value={projectMatchEmail.data.projectTitle}
                    onChange={(e) =>
                      setProjectMatchEmail({
                        ...projectMatchEmail,
                        data: { ...projectMatchEmail.data, projectTitle: e.target.value }
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Budget (min-max)</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      value={projectMatchEmail.data.projectBudgetMin}
                      onChange={(e) =>
                        setProjectMatchEmail({
                          ...projectMatchEmail,
                          data: { ...projectMatchEmail.data, projectBudgetMin: Number(e.target.value) }
                        })
                      }
                      placeholder="Min"
                    />
                    <Input
                      type="number"
                      value={projectMatchEmail.data.projectBudgetMax}
                      onChange={(e) =>
                        setProjectMatchEmail({
                          ...projectMatchEmail,
                          data: { ...projectMatchEmail.data, projectBudgetMax: Number(e.target.value) }
                        })
                      }
                      placeholder="Max"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => sendTemplateEmail(projectMatchEmail)}
                  disabled={loading}
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
                      Envoyer email match projet
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Info Box */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-base">ℹ️ Service Nodemailer</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                <p>
                  <strong>Endpoint:</strong> http://localhost:3001/api/email
                </p>
                <p>
                  <strong>Templates disponibles:</strong> welcome, password-reset, project-match, proposal-received, payment-confirmation
                </p>
                <p>
                  <strong>Assurez-vous</strong> que le service Nodemailer est en cours d'exécution avant d'envoyer des emails.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
