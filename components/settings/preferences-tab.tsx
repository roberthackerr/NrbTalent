"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Palette, Sun, Moon, Languages, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useParams, usePathname, useRouter } from 'next/navigation'
import type { Locale } from '@/lib/i18n/config'
import { locales, localeNames, localeFlags } from '@/lib/i18n/config'

// Liste des langues disponibles (maintenant basée sur la config i18n)
const LANGUAGES = locales.map(code => ({
  code,
  name: localeNames[code as Locale],
  nativeName: localeNames[code as Locale],
  flag: localeFlags[code as Locale]
}))

interface PreferencesTabProps {
  dict: any
  lang: Locale
}

export function PreferencesTab({ dict, lang }: PreferencesTabProps) {
  const { theme, setTheme, systemTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  
  const [mounted, setMounted] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Locale>(lang)

  useEffect(() => {
    setMounted(true)
    setSelectedLanguage(lang)
  }, [lang])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const getCurrentThemeIcon = () => {
    if (!mounted) return <Sun className="h-4 w-4" />
    const currentTheme = theme === "system" ? systemTheme : theme
    return currentTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
  }

  const handleLanguageSelect = (langCode: string) => {
    const newLang = langCode as Locale
    setSelectedLanguage(newLang)
    
    // Changer la langue dans l'URL
    const segments = pathname.split('/')
    segments[1] = newLang
    const newPathname = segments.join('/')
    router.push(newPathname)
  }

  const getThemeText = () => {
    if (!mounted) return dict?.preferences?.light || "Mode Clair"
    return theme === "dark" 
      ? dict?.preferences?.dark || "Mode Sombre" 
      : dict?.preferences?.light || "Mode Clair"
  }

  const getThemeDescription = () => {
    return dict?.preferences?.toggle || "Basculer entre le mode clair et sombre"
  }

  return (
    <div className="space-y-6">
      {/* Section Langue */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Languages className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div>{dict?.preferences?.language || "Langue de l'interface"}</div>
              <CardDescription className="text-sm mt-1">
                {dict?.preferences?.languageDescription || "Choisissez votre langue préférée pour l'interface"}
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélecteur de langue personnalisé */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {dict?.preferences?.selectedLanguage || "Langue sélectionnée"}
              </Label>
            </div>
            
            {/* Grille des langues */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {LANGUAGES.map((language) => (
                <Button
                  key={language.code}
                  variant={selectedLanguage === language.code ? "default" : "outline"}
                  className={`h-16 flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedLanguage === language.code 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  onClick={() => handleLanguageSelect(language.code)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{language.flag}</span>
                    {selectedLanguage === language.code && (
                      <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="text-xs font-medium leading-tight">
                    {language.nativeName}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Indicateur de statut */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className={`w-2 h-2 rounded-full ${
              selectedLanguage === 'fr' ? 'bg-slate-400' : 'bg-green-500 animate-pulse'
            }`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {selectedLanguage === 'fr' 
                  ? (dict?.preferences?.originalLanguage || "Langue originale (Français)")
                  : (dict?.preferences?.translationActive || "Traduction active")}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {selectedLanguage === 'fr' 
                  ? (dict?.preferences?.originalContent || "Le contenu s'affiche dans sa langue d'origine")
                  : `${dict?.preferences?.translatedTo || "Traduction en"} ${LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName}`
                }
              </p>
            </div>
          </div>

          {/* Note sur la traduction */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-400">
              <strong>Note:</strong> Le changement de langue affecte toute l'interface. 
              Les projets et les messages des clients resteront dans leur langue d'origine.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section Apparence */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div>{dict?.preferences?.appearance || "Apparence"}</div>
              <CardDescription className="text-sm mt-1">
                {dict?.preferences?.appearanceDescription || "Personnalisez l'apparence de l'interface"}
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle du thème */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                {getCurrentThemeIcon()}
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {getThemeText()}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {getThemeDescription()}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleTheme}
              className="shadow-sm"
            >
              {dict?.preferences?.toggle || "Basculer"}
            </Button>
          </div>

          {/* Sélecteur de thème avancé */}
          {mounted && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {dict?.preferences?.themePreference || "Préférence de thème"}
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="flex flex-col items-center gap-2 h-16"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-4 w-4" />
                  <span className="text-xs">{dict?.preferences?.light || "Clair"}</span>
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="flex flex-col items-center gap-2 h-16"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-4 w-4" />
                  <span className="text-xs">{dict?.preferences?.dark || "Sombre"}</span>
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className="flex flex-col items-center gap-2 h-16"
                  onClick={() => setTheme("system")}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs">{dict?.preferences?.system || "Système"}</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}