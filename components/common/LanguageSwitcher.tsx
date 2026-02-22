// components/common/LanguageSwitcher.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n/config'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher({ lang }: { lang: Locale }) {
  const router = useRouter()
  const pathname = usePathname()
  
  const switchLanguage = (newLang: Locale) => {
    // Remplacer la langue dans l'URL
    const segments = pathname.split('/')
    segments[1] = newLang
    const newPathname = segments.join('/')
    router.push(newPathname)
  }
  
  // Fonction pour empêcher la propagation du clic
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={handleTriggerClick}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 relative z-[100] cursor-pointer"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden md:inline">{localeNames[lang]}</span>
            <span className="md:hidden">{localeFlags[lang]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[100]">
          {locales.map((locale) => (
            <DropdownMenuItem
              key={locale}
              onClick={() => switchLanguage(locale)}
              className={locale === lang ? 'bg-accent cursor-pointer' : 'cursor-pointer'}
            >
              <span className="mr-2">{localeFlags[locale]}</span>
              {localeNames[locale]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}