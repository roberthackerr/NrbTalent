"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Palette, Sun, Moon, Languages, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

// Configuration des langues disponibles
const LANGUAGES = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
]

export function PreferencesTab() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('fr')

  useEffect(() => {
    setMounted(true)
    
    // Charger le script Google Translate
    const loadGoogleTranslate = () => {
      if (document.getElementById('google-translate-script')) return
      
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.head.appendChild(script)

      window.googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement({
          pageLanguage: 'fr',
          includedLanguages: LANGUAGES.map(lang => lang.code).join(','),
          layout: (window as any).google.translate.TranslateElement.InlineLayout.HORIZONTAL,
          autoDisplay: false,
          multilanguagePage: true
        }, 'google_translate_element')
      }
    }

    loadGoogleTranslate()
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const getCurrentThemeIcon = () => {
    if (!mounted) return <Sun className="h-4 w-4" />
    const currentTheme = theme === "system" ? systemTheme : theme
    return currentTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
  }

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLanguage(langCode)
    
    // Déclencher la traduction Google
    setTimeout(() => {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement
      if (select) {
        select.value = langCode
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }, 100)
  }

  const resetTranslation = () => {
    setSelectedLanguage('fr')
    // Réinitialiser à la langue originale
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement
    if (select) {
      select.value = 'fr'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Traduction */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Languages className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div>Traduction de la page</div>
              <CardDescription className="text-sm mt-1">
                Traduisez l'ensemble du contenu dans votre langue préférée
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Widget Google Translate masqué mais fonctionnel */}
          <div className="hidden">
            <div id="google_translate_element"></div>
          </div>

          {/* Sélecteur de langue personnalisé */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Langue sélectionnée</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetTranslation}
                className="text-xs h-8"
              >
                Réinitialiser
              </Button>
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
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {language.name}
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
                {selectedLanguage === 'fr' ? 'Langue originale (Français)' : 'Traduction active'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {selectedLanguage === 'fr' 
                  ? 'Le contenu s\'affiche dans sa langue d\'origine' 
                  : `Traduction en ${LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName}`
                }
              </p>
            </div>
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
              <div>Apparence</div>
              <CardDescription className="text-sm mt-1">
                Personnalisez l'apparence de l'interface
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
                  {theme === "dark" ? "Mode Sombre" : "Mode Clair"}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Basculer entre le mode clair et sombre
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleTheme}
              className="shadow-sm"
            >
              Basculer
            </Button>
          </div>

          {/* Sélecteur de thème avancé */}
          {mounted && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Préférence de thème</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="flex flex-col items-center gap-2 h-16"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-4 w-4" />
                  <span className="text-xs">Clair</span>
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="flex flex-col items-center gap-2 h-16"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-4 w-4" />
                  <span className="text-xs">Sombre</span>
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className="flex flex-col items-center gap-2 h-16"
                  onClick={() => setTheme("system")}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs">Système</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx global>{`
        /* Personnalisation du widget Google Translate */
        .goog-te-banner-frame {
          display: none !important;
        }
        .goog-te-menu-value {
          display: none !important;
        }
        .goog-te-gadget {
          font-size: 0 !important;
        }
        .goog-te-gadget .goog-te-combo {
          margin: 0 !important;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          color: #374151;
          font-size: 14px;
        }
        .dark .goog-te-gadget .goog-te-combo {
          background: #1f2937;
          border-color: #4b5563;
          color: #f9fafb;
        }
        .goog-logo-link {
          display: none !important;
        }
        .goog-te-gadget {
          color: transparent !important;
        }
        
        /* Styles pour le contenu traduit */
        body {
          top: 0 !important;
        }
        .goog-tooltip {
          display: none !important;
        }
        .goog-tooltip:hover {
          display: none !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  )
}

// Déclaration pour TypeScript
declare global {
  interface Window {
    googleTranslateElementInit: () => void;
  }
}