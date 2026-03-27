import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import type { Locale } from '@/lib/i18n/config'

interface FooterProps {
  dict: any
  lang: Locale
}

export const Footer = ({ dict, lang }: FooterProps) => {
  const params = useParams()
  const currentLang = (params.lang as Locale) || lang || 'fr'

  // Helper function to get translated text
  const t = (key: string, fallback: string): string => {
    if (!dict?.footers?.[key]) return fallback
    const value = dict.footers[key]
    if (typeof value === "string") return value
    return fallback
  }

  // Get legal texts with fallbacks
  const getLegalText = (key: string, fallback: string): string => {
    if (!dict?.legals?.[key]) return fallback
    const value = dict.legals[key]
    if (typeof value === "string") return value
    if (typeof value === "object" && value !== null && value.title) return value.title
    return fallback
  }

  return (
    <footer className="border-t border-border/40 py-12 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo et description */}
          <div>
            <div className="flex items-center gap-2">
              <Image 
                src={`/logo.png?v=${Date.now()}`} 
                alt="NRBTalents" 
                width={32} 
                height={32} 
                className="h-8 w-8 transition-transform hover:scale-110" 
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                NRBTalents
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('tagline', 'Where true talent meets innovation.')}
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">
              {t('platform', 'Platform')}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${currentLang}/talents`} className="hover:text-foreground transition-colors">
                  {t('findTalents', 'Find Talents')}
                </Link>
              </li>
              <li>
                <Link href={`/${currentLang}/services`} className="hover:text-foreground transition-colors">
                  {t('browseServices', 'Browse Services')}
                </Link>
              </li>
              <li>
                <Link href={`/${currentLang}/how-it-works`} className="hover:text-foreground transition-colors">
                  {t('howItWorks', 'How It Works')}
                </Link>
              </li>
              <li>
                <Link href={`/${currentLang}/pricing`} className="hover:text-foreground transition-colors">
                  {t('pricing', 'Pricing')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">
              {t('company', 'Company')}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${currentLang}/about`} className="hover:text-foreground transition-colors">
                  {t('aboutUs', 'About Us')}
                </Link>
              </li>
              <li>
                <Link href={`/${currentLang}/blog`} className="hover:text-foreground transition-colors">
                  {t('blog', 'Blog')}
                </Link>
              </li>
              <li>
                <Link href={`/${currentLang}/careers`} className="hover:text-foreground transition-colors">
                  {t('careers', 'Careers')}
                </Link>
              </li>
              <li>
                <Link href={`/${currentLang}/contact`} className="hover:text-foreground transition-colors">
                  {t('contact', 'Contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links - Fixed the title to use 'legal' from footers */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">
              {t('legal', 'Legal')}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${currentLang}/privacy`} className="hover:text-foreground transition-colors">
                  {getLegalText('privacy', 'Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link href={`/${currentLang}/terms`} className="hover:text-foreground transition-colors">
                  {getLegalText('terms', 'Terms of Service')}
                </Link>
              </li>
              <li>
                <Link href={`/${currentLang}/cookies`} className="hover:text-foreground transition-colors">
                  {getLegalText('cookies', 'Cookie Policy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} NRBTalents. {t('copyright', 'All rights reservedh.')}
          </p>
        </div>
      </div>
    </footer>
  )
}