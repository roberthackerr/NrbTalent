// components/common/LanguageSwitcher.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n/config'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, CheckCircle2, Loader2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export default function LanguageSwitcher({ lang }: { lang: Locale }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, update: updateSession } = useSession()
  const [savingLang, setSavingLang] = useState<Locale | null>(null)

  const saveLanguageToProfile = useCallback(async (newLang: Locale): Promise<boolean> => {
    if (!session?.user) return true
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'preferences',
          data: {
            language: newLang,
            ...(session.user.preferences || {})
          }
        })
      })

      if (!response.ok) throw new Error('Failed to save language')
      
      await updateSession({
        ...session,
        user: {
          ...session.user,
          language: newLang,
          preferences: {
            ...session.user.preferences,
            language: newLang
          }
        }
      })
      
      return true
    } catch (error) {
      console.error('Error saving language:', error)
      return false
    }
  }, [session, updateSession])

  const switchLanguage = useCallback(async (newLang: Locale) => {
    if (newLang === lang) return
    
    setSavingLang(newLang)
    
    try {
      // Save language preference if user is logged in
      if (session?.user) {
        const saved = await saveLanguageToProfile(newLang)
        
        if (saved) {
          toast.success(
            newLang === 'fr' ? 'Langue modifiée avec succès' :
            newLang === 'en' ? 'Language changed successfully' :
            'Fiteny novaina soa aman-tsara',
            { duration: 2000 }
          )
        }
      }
      
      // Build the new pathname with the selected language
      const segments = pathname.split('/')
      // Replace the language segment (first segment after empty string)
      segments[1] = newLang
      const newPathname = segments.join('/') || '/'
      
      // Redirect to the new language version
      router.push(newPathname)
      
    } catch (error) {
      console.error('Error switching language:', error)
      toast.error(
        lang === 'fr' ? 'Erreur lors du changement de langue' :
        lang === 'en' ? 'Error changing language' :
        'Nisy hadisoana tamin\'ny fanovana fiteny',
        { duration: 3000 }
      )
    } finally {
      setSavingLang(null)
    }
  }, [lang, pathname, router, session, saveLanguageToProfile])

  const handleTriggerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const currentLocaleName = localeNames[lang]
  const currentLocaleFlag = localeFlags[lang]

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={handleTriggerClick}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 relative z-[100] cursor-pointer hover:bg-accent/50 transition-colors"
            disabled={!!savingLang}
          >
            {savingLang ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span className="hidden md:inline">
              {savingLang ? `${localeFlags[savingLang]} ${localeNames[savingLang]}` : currentLocaleName}
            </span>
            <span className="md:hidden">
              {savingLang ? localeFlags[savingLang] : currentLocaleFlag}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[100] min-w-[160px]">
          {locales.map((locale) => {
            const isCurrent = locale === lang
            const isSaving = savingLang === locale
            
            return (
              <DropdownMenuItem
                key={locale}
                onClick={() => switchLanguage(locale)}
                disabled={isSaving || isCurrent}
                className={cn(
                  "cursor-pointer transition-colors",
                  isCurrent && "bg-accent/50",
                  isSaving && "opacity-50 cursor-wait"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{localeFlags[locale]}</span>
                    <span>{localeNames[locale]}</span>
                  </div>
                  {isCurrent && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {isSaving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}