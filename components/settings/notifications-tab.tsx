"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Bell, Mail, MessageSquare, Calendar, CreditCard, Users, Shield, TrendingUp, FileText, DollarSign } from "lucide-react"

interface NotificationSetting {
  id: string
  label: string
  description: string
  enabled: boolean
  channel: 'email' | 'push' | 'in_app'
}

interface NotificationCategory {
  category: string
  icon: any
  description: string
  settings: NotificationSetting[]
}

interface NotificationsTabProps {
  dict: any
  lang: string
}

export function NotificationsTab({ dict, lang }: NotificationsTabProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<NotificationCategory[]>([])

  // Initialize categories with dictionary values
  useEffect(() => {
    if (!dict) return

    const defaultCategories: NotificationCategory[] = [
      {
        category: dict?.notifications?.email || "Email",
        icon: Mail,
        description: dict?.notifications?.emailDesc || "Contrôlez les notifications par email",
        settings: [
          { id: "email-messages", label: dict?.notifications?.newMessages || "Nouveaux messages", description: dict?.notifications?.newMessagesDesc || "Recevoir des emails pour les nouveaux messages", enabled: true, channel: 'email' },
          { id: "email-projects", label: dict?.notifications?.projectUpdates || "Mises à jour de projets", description: dict?.notifications?.projectUpdatesDesc || "Notifications sur l'état des projets", enabled: true, channel: 'email' },
          { id: "email-applications", label: dict?.notifications?.newApplications || "Nouvelles candidatures", description: dict?.notifications?.newApplicationsDesc || "Alertes pour les nouvelles candidatures", enabled: true, channel: 'email' },
          { id: "email-offers", label: dict?.notifications?.jobOffers || "Offres d'emploi", description: dict?.notifications?.jobOffersDesc || "Nouvelles offres correspondant à vos compétences", enabled: true, channel: 'email' },
          { id: "email-payments", label: dict?.notifications?.payments || "Paiements", description: dict?.notifications?.paymentsDesc || "Notifications sur les paiements et factures", enabled: true, channel: 'email' },
          { id: "email-marketing", label: dict?.notifications?.marketing || "Emails marketing", description: dict?.notifications?.marketingDesc || "Nouvelles fonctionnalités et conseils", enabled: false, channel: 'email' },
        ]
      },
      {
        category: dict?.notifications?.push || "Push",
        icon: Bell,
        description: dict?.notifications?.pushDesc || "Notifications push dans le navigateur",
        settings: [
          { id: "push-messages", label: dict?.notifications?.messages || "Messages", description: dict?.notifications?.messagesPushDesc || "Notifications push pour les messages", enabled: true, channel: 'push' },
          { id: "push-projects", label: dict?.notifications?.matchingProjects || "Projets correspondants", description: dict?.notifications?.matchingProjectsDesc || "Nouveaux projets selon vos compétences", enabled: true, channel: 'push' },
          { id: "push-deadlines", label: dict?.notifications?.deadlines || "Échéances", description: dict?.notifications?.deadlinesDesc || "Rappels pour les dates limites", enabled: true, channel: 'push' },
          { id: "push-bids", label: dict?.notifications?.bidUpdates || "Mises à jour des soumissions", description: dict?.notifications?.bidUpdatesDesc || "Mises à jour sur vos soumissions", enabled: true, channel: 'push' },
          { id: "push-reviews", label: dict?.notifications?.reviews || "Avis", description: dict?.notifications?.reviewsDesc || "Nouveaux avis et évaluations", enabled: true, channel: 'push' },
        ]
      },
      {
        category: dict?.notifications?.security || "Sécurité",
        icon: Shield,
        description: dict?.notifications?.securityDesc || "Alertes de sécurité et de compte",
        settings: [
          { id: "security-login", label: dict?.notifications?.newLogins || "Nouvelles connexions", description: dict?.notifications?.newLoginsDesc || "Alertes pour les nouvelles connexions", enabled: true, channel: 'email' },
          { id: "security-password", label: dict?.notifications?.passwordChanges || "Changements de mot de passe", description: dict?.notifications?.passwordChangesDesc || "Confirmation des changements de mot de passe", enabled: true, channel: 'email' },
          { id: "security-2fa", label: dict?.notifications?.twoFA || "Authentification à deux facteurs", description: dict?.notifications?.twoFADesc || "Mises à jour de l'authentification 2FA", enabled: true, channel: 'email' },
          { id: "security-verification", label: dict?.notifications?.accountVerification || "Vérification de compte", description: dict?.notifications?.accountVerificationDesc || "Mises à jour de vérification", enabled: true, channel: 'email' },
        ]
      },
      {
        category: dict?.notifications?.payments || "Paiements",
        icon: DollarSign,
        description: dict?.notifications?.paymentsCategoryDesc || "Notifications financières",
        settings: [
          { id: "payment-invoices", label: dict?.notifications?.invoices || "Factures", description: dict?.notifications?.invoicesDesc || "Création et paiement des factures", enabled: true, channel: 'email' },
          { id: "payment-withdrawals", label: dict?.notifications?.withdrawals || "Retraits", description: dict?.notifications?.withdrawalsDesc || "Demandes et confirmations de retrait", enabled: true, channel: 'email' },
          { id: "payment-escrow", label: dict?.notifications?.escrow || "Escrow", description: dict?.notifications?.escrowDesc || "Mises à jour des fonds en attente", enabled: true, channel: 'email' },
          { id: "payment-disputes", label: dict?.notifications?.disputes || "Litiges", description: dict?.notifications?.disputesDesc || "Alertes de litiges et résolutions", enabled: true, channel: 'email' },
        ]
      },
      {
        category: dict?.notifications?.community || "Communauté",
        icon: Users,
        description: dict?.notifications?.communityDesc || "Notifications sociales et de réseau",
        settings: [
          { id: "social-connections", label: dict?.notifications?.connections || "Connexions", description: dict?.notifications?.connectionsDesc || "Nouvelles demandes de connexion", enabled: true, channel: 'in_app' },
          { id: "social-follows", label: dict?.notifications?.follows || "Abonnements", description: dict?.notifications?.followsDesc || "Nouveaux abonnés", enabled: true, channel: 'in_app' },
          { id: "social-endorsements", label: dict?.notifications?.endorsements || "Recommandations", description: dict?.notifications?.endorsementsDesc || "Recommandations de compétences", enabled: true, channel: 'in_app' },
          { id: "social-events", label: dict?.notifications?.events || "Événements", description: dict?.notifications?.eventsDesc || "Événements et webinaires", enabled: false, channel: 'email' },
        ]
      }
    ]

    setCategories(defaultCategories)
    loadPreferences()
  }, [dict])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.preferences && Array.isArray(data.preferences)) {
        updateCategoriesWithPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast({
        title: dict?.common?.error || "Erreur de chargement",
        description: dict?.notifications?.loadError || "Impossible de charger les préférences. Utilisation des paramètres par défaut.",
        variant: "destructive",
      })
    }
  }

  const updateCategoriesWithPreferences = (preferences: any[]) => {
    if (!Array.isArray(preferences)) return

    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        settings: category.settings.map(setting => {
          const savedPref = preferences.find(p => p && p.settingId === setting.id)
          return savedPref ? { ...setting, enabled: savedPref.enabled } : setting
        })
      }))
    )
  }

  const handleToggle = async (settingId: string, enabled: boolean) => {
    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        settings: category.settings.map(setting => 
          setting.id === settingId ? { ...setting, enabled } : setting
        )
      }))
    )

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settingId,
          enabled,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save preference')
      }

      toast({
        title: dict?.common?.success || "Préférence sauvegardée",
        description: dict?.notifications?.saveSuccess || "Votre préférence de notification a été mise à jour.",
      })
    } catch (error) {
      console.error('Error saving preference:', error)
      toast({
        title: dict?.common?.error || "Erreur",
        description: dict?.notifications?.saveError || "Impossible de sauvegarder la préférence. Veuillez réessayer.",
        variant: "destructive",
      })
      
      setCategories(prevCategories => 
        prevCategories.map(category => ({
          ...category,
          settings: category.settings.map(setting => 
            setting.id === settingId ? { ...setting, enabled: !enabled } : setting
          )
        }))
      )
    }
  }

  const handleSaveAll = async () => {
    setIsLoading(true)
    
    const allSettings = categories.flatMap(category => category.settings)
    
    try {
      const response = await fetch('/api/notifications/preferences/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: allSettings.map(setting => ({
            id: setting.id,
            enabled: setting.enabled
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({
        title: dict?.common?.success || "Préférences sauvegardées",
        description: dict?.notifications?.saveAllSuccess || "Toutes vos préférences de notification ont été sauvegardées.",
      })
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast({
        title: dict?.common?.error || "Erreur",
        description: dict?.notifications?.saveAllError || "Impossible de sauvegarder les préférences. Veuillez réessayer.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {dict?.notifications?.title || "Notifications"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {dict?.notifications?.subtitle || "Gérez comment et quand vous recevez des notifications"}
          </p>
        </div>
        <Button 
          onClick={handleSaveAll} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading 
            ? (dict?.common?.saving || "Sauvegarde...") 
            : (dict?.common?.saveAll || "Sauvegarder tout")}
        </Button>
      </div>

      {categories.map((category) => {
        const Icon = category.icon
        return (
          <Card key={category.category} className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-blue-500" />
                {category.category}
              </CardTitle>
              <CardDescription>
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={setting.id} className="font-medium text-slate-900 dark:text-slate-100">
                        {setting.label}
                      </Label>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {setting.channel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {setting.description}
                    </p>
                  </div>
                  <Switch 
                    id={setting.id} 
                    checked={setting.enabled}
                    onCheckedChange={(checked) => handleToggle(setting.id, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}