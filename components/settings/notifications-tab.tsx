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

// Default categories data
const defaultCategories: NotificationCategory[] = [
  {
    category: "Email",
    icon: Mail,
    description: "Contrôlez les notifications par email",
    settings: [
      { id: "email-messages", label: "Nouveaux messages", description: "Recevoir des emails pour les nouveaux messages", enabled: true, channel: 'email' },
      { id: "email-projects", label: "Mises à jour de projets", description: "Notifications sur l'état des projets", enabled: true, channel: 'email' },
      { id: "email-applications", label: "Nouvelles candidatures", description: "Alertes pour les nouvelles candidatures", enabled: true, channel: 'email' },
      { id: "email-offers", label: "Offres d'emploi", description: "Nouvelles offres correspondant à vos compétences", enabled: true, channel: 'email' },
      { id: "email-payments", label: "Paiements", description: "Notifications sur les paiements et factures", enabled: true, channel: 'email' },
      { id: "email-marketing", label: "Emails marketing", description: "Nouvelles fonctionnalités et conseils", enabled: false, channel: 'email' },
    ]
  },
  {
    category: "Push",
    icon: Bell,
    description: "Notifications push dans le navigateur",
    settings: [
      { id: "push-messages", label: "Messages", description: "Notifications push pour les messages", enabled: true, channel: 'push' },
      { id: "push-projects", label: "Projets correspondants", description: "Nouveaux projets selon vos compétences", enabled: true, channel: 'push' },
      { id: "push-deadlines", label: "Échéances", description: "Rappels pour les dates limites", enabled: true, channel: 'push' },
      { id: "push-bids", label: "Mises à jour des soumissions", description: "Mises à jour sur vos soumissions", enabled: true, channel: 'push' },
      { id: "push-reviews", label: "Avis", description: "Nouveaux avis et évaluations", enabled: true, channel: 'push' },
    ]
  },
  {
    category: "Sécurité",
    icon: Shield,
    description: "Alertes de sécurité et de compte",
    settings: [
      { id: "security-login", label: "Nouvelles connexions", description: "Alertes pour les nouvelles connexions", enabled: true, channel: 'email' },
      { id: "security-password", label: "Changements de mot de passe", description: "Confirmation des changements de mot de passe", enabled: true, channel: 'email' },
      { id: "security-2fa", label: "Authentification à deux facteurs", description: "Mises à jour de l'authentification 2FA", enabled: true, channel: 'email' },
      { id: "security-verification", label: "Vérification de compte", description: "Mises à jour de vérification", enabled: true, channel: 'email' },
    ]
  },
  {
    category: "Paiements",
    icon: DollarSign,
    description: "Notifications financières",
    settings: [
      { id: "payment-invoices", label: "Factures", description: "Création et paiement des factures", enabled: true, channel: 'email' },
      { id: "payment-withdrawals", label: "Retraits", description: "Demandes et confirmations de retrait", enabled: true, channel: 'email' },
      { id: "payment-escrow", label: "Escrow", description: "Mises à jour des fonds en attente", enabled: true, channel: 'email' },
      { id: "payment-disputes", label: "Litiges", description: "Alertes de litiges et résolutions", enabled: true, channel: 'email' },
    ]
  },
  {
    category: "Communauté",
    icon: Users,
    description: "Notifications sociales et de réseau",
    settings: [
      { id: "social-connections", label: "Connexions", description: "Nouvelles demandes de connexion", enabled: true, channel: 'in_app' },
      { id: "social-follows", label: "Abonnements", description: "Nouveaux abonnés", enabled: true, channel: 'in_app' },
      { id: "social-endorsements", label: "Recommandations", description: "Recommandations de compétences", enabled: true, channel: 'in_app' },
      { id: "social-events", label: "Événements", description: "Événements et webinaires", enabled: false, channel: 'email' },
    ]
  }
]

export function NotificationsTab() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<NotificationCategory[]>(defaultCategories)

  // Load preferences on component mount
  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Check if data.preferences exists and is an array
      if (data.preferences && Array.isArray(data.preferences)) {
        updateCategoriesWithPreferences(data.preferences)
      } else {
        console.warn('No preferences found or invalid format:', data)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les préférences. Utilisation des paramètres par défaut.",
        variant: "destructive",
      })
    }
  }

  const updateCategoriesWithPreferences = (preferences: any[]) => {
    if (!Array.isArray(preferences)) {
      console.error('preferences is not an array:', preferences)
      return
    }

    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        settings: category.settings.map(setting => {
          // Safely find preference
          const savedPref = Array.isArray(preferences) 
            ? preferences.find(p => p && p.settingId === setting.id)
            : null
          
          return savedPref ? { ...setting, enabled: savedPref.enabled } : setting
        })
      }))
    )
  }

  const handleToggle = async (settingId: string, enabled: boolean) => {
    // Update local state immediately for better UX
    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        settings: category.settings.map(setting => 
          setting.id === settingId ? { ...setting, enabled } : setting
        )
      }))
    )

    // Save to API
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
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
        title: "Préférence sauvegardée",
        description: "Votre préférence de notification a été mise à jour.",
      })
    } catch (error) {
      console.error('Error saving preference:', error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la préférence. Veuillez réessayer.",
        variant: "destructive",
      })
      
      // Revert on error
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
    
    // Collect all settings
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

      const data = await response.json()
      
      toast({
        title: "Préférences sauvegardées",
        description: "Toutes vos préférences de notification ont été sauvegardées.",
      })
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les préférences. Veuillez réessayer.",
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Gérez comment et quand vous recevez des notifications
          </p>
        </div>
        <Button 
          onClick={handleSaveAll} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Sauvegarde..." : "Sauvegarder tout"}
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