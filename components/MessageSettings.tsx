// components/MessageSettings.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Eye, Palette, Shield, Download, Zap } from "lucide-react"
import { MessagePreferences } from "@/types/chat"

interface MessageSettingsProps {
  preferences: MessagePreferences
  onSave: (prefs: Partial<MessagePreferences>) => void
  onReset: () => void
  isOpen: boolean
  onClose: () => void
}

export const MessageSettings = ({ 
  preferences, 
  onSave, 
  onReset, 
  isOpen, 
  onClose 
}: MessageSettingsProps) => {
  const [localPreferences, setLocalPreferences] = useState(preferences)

  if (!isOpen) return null

  const handleSave = () => {
    onSave(localPreferences)
    onClose()
  }

  const handleCancel = () => {
    setLocalPreferences(preferences)
    onClose()
  }

  const updatePreference = (key: keyof MessagePreferences, value: any) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Paramètres des messages
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Personnalisez votre expérience de messagerie
          </p>
        </div>

        <div className="overflow-y-auto max-h-[70vh] p-6">
          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="behavior" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Comportement</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Apparence</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Confidentialité</span>
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Stockage</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
            </TabsList>

            {/* 🔔 NOTIFICATIONS */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Contrôlez comment vous recevez les notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Son des messages</p>
                      <p className="text-sm text-gray-500">Jouer un son pour les nouveaux messages</p>
                    </div>
                    <Switch
                      checked={localPreferences.soundEnabled}
                      onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications bureau</p>
                      <p className="text-sm text-gray-500">Afficher les notifications sur le bureau</p>
                    </div>
                    <Switch
                      checked={localPreferences.desktopNotifications}
                      onCheckedChange={(checked) => updatePreference('desktopNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Vibration</p>
                      <p className="text-sm text-gray-500">Vibrer pour les nouveaux messages</p>
                    </div>
                    <Switch
                      checked={localPreferences.vibration}
                      onCheckedChange={(checked) => updatePreference('vibration', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 💬 COMPORTEMENT */}
            <TabsContent value="behavior" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Comportement des messages</CardTitle>
                  <CardDescription>
                    Personnalisez l'interaction avec les messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Entrée pour envoyer</p>
                      <p className="text-sm text-gray-500">Appuyez sur Entrée pour envoyer un message</p>
                    </div>
                    <Switch
                      checked={localPreferences.enterToSend}
                      onCheckedChange={(checked) => updatePreference('enterToSend', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marquer comme lu à l'ouverture</p>
                      <p className="text-sm text-gray-500">Marquer automatiquement les messages comme lus</p>
                    </div>
                    <Switch
                      checked={localPreferences.markAsReadOnOpen}
                      onCheckedChange={(checked) => updatePreference('markAsReadOnOpen', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Indicateurs de frappe</p>
                      <p className="text-sm text-gray-500">Voir quand les autres tapent</p>
                    </div>
                    <Switch
                      checked={localPreferences.showTypingIndicators}
                      onCheckedChange={(checked) => updatePreference('showTypingIndicators', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Accusés de lecture</p>
                      <p className="text-sm text-gray-500">Voir quand vos messages sont lus</p>
                    </div>
                    <Switch
                      checked={localPreferences.showReadReceipts}
                      onCheckedChange={(checked) => updatePreference('showReadReceipts', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 🎨 APPAREANCE */}
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Apparence</CardTitle>
                  <CardDescription>
                    Personnalisez l'apparence de l'application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-medium">Thème</label>
                    <Select
                      value={localPreferences.theme}
                      onValueChange={(value: any) => updatePreference('theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automatique</SelectItem>
                        <SelectItem value="light">Clair</SelectItem>
                        <SelectItem value="dark">Sombre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium">Taille de police</label>
                    <Select
                      value={localPreferences.fontSize}
                      onValueChange={(value: any) => updatePreference('fontSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Petite</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium">Style des bulles</label>
                    <Select
                      value={localPreferences.bubbleStyle}
                      onValueChange={(value: any) => updatePreference('bubbleStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Défaut</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="rounded">Arrondi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 🔒 CONFIDENTIALITÉ */}
            <TabsContent value="privacy" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Confidentialité</CardTitle>
                  <CardDescription>
                    Contrôlez votre vie privée
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-medium">Dernière connexion</label>
                    <Select
                      value={localPreferences.lastSeen}
                      onValueChange={(value: any) => updatePreference('lastSeen', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Tout le monde</SelectItem>
                        <SelectItem value="contacts">Mes contacts</SelectItem>
                        <SelectItem value="nobody">Personne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium">Photo de profil</label>
                    <Select
                      value={localPreferences.profilePhoto}
                      onValueChange={(value: any) => updatePreference('profilePhoto', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Tout le monde</SelectItem>
                        <SelectItem value="contacts">Mes contacts</SelectItem>
                        <SelectItem value="nobody">Personne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium">Accusés de lecture</label>
                    <Select
                      value={localPreferences.readReceipts}
                      onValueChange={(value: any) => updatePreference('readReceipts', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Tout le monde</SelectItem>
                        <SelectItem value="contacts">Mes contacts</SelectItem>
                        <SelectItem value="nobody">Personne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Autres onglets... */}
          </Tabs>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <Button variant="outline" onClick={onReset}>
            Réinitialiser
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}