"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Mail, MessageSquare, Calendar, CreditCard } from "lucide-react"

export function NotificationsTab() {
  const notificationSettings = [
    {
      category: "Email",
      icon: Mail,
      settings: [
        { id: "email-messages", label: "Nouveaux messages", description: "Recevoir des emails pour les nouveaux messages", defaultChecked: true },
        { id: "email-projects", label: "Mises à jour de projets", description: "Notifications sur l'état des projets", defaultChecked: true },
        { id: "email-applications", label: "Nouvelles candidatures", description: "Alertes pour les nouvelles candidatures", defaultChecked: true },
        { id: "email-marketing", label: "Emails marketing", description: "Nouvelles fonctionnalités et conseils", defaultChecked: false },
      ]
    },
    {
      category: "Push",
      icon: Bell,
      settings: [
        { id: "push-messages", label: "Messages", description: "Notifications push pour les messages", defaultChecked: true },
        { id: "push-projects", label: "Projets correspondants", description: "Nouveaux projets selon vos compétences", defaultChecked: true },
        { id: "push-deadlines", label: "Échéances", description: "Rappels pour les dates limites", defaultChecked: true },
      ]
    }
  ]

  return (
    <div className="space-y-6">
      {notificationSettings.map((category) => {
        const Icon = category.icon
        return (
          <Card key={category.category} className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-blue-500" />
                Notifications {category.category}
              </CardTitle>
              <CardDescription>
                Contrôlez les notifications {category.category.toLowerCase()} que vous recevez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.settings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor={setting.id} className="font-medium text-slate-900 dark:text-slate-100">
                      {setting.label}
                    </Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {setting.description}
                    </p>
                  </div>
                  <Switch id={setting.id} defaultChecked={setting.defaultChecked} />
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}