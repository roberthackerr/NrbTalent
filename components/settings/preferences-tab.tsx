"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Palette, Eye, EyeOff } from "lucide-react"

export function PreferencesTab() {
  return (
    <div className="space-y-6">
      {/* Langue et région */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Langue et Région
          </CardTitle>
          <CardDescription>
            Personnalisez votre langue et vos préférences régionales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="language" className="text-sm font-medium">
              Langue
            </Label>
            <Select defaultValue="fr">
              <SelectTrigger className="border-slate-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="timezone" className="text-sm font-medium">
              Fuseau Horaire
            </Label>
            <Select defaultValue="europe-paris">
              <SelectTrigger className="border-slate-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="europe-paris">Europe/Paris (UTC+1)</SelectItem>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="america-new_york">America/New_York (UTC-5)</SelectItem>
                <SelectItem value="asia/tokyo">Asia/Tokyo (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="currency" className="text-sm font-medium">
              Devise
            </Label>
            <Select defaultValue="eur">
              <SelectTrigger className="border-slate-200 dark:border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eur">EUR (€)</SelectItem>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="gbp">GBP (£)</SelectItem>
                <SelectItem value="cad">CAD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Apparence */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            Apparence
          </CardTitle>
          <CardDescription>
            Personnalisez l'apparence de l'interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Mode Sombre
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Basculer entre le mode clair et sombre
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Basculer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}