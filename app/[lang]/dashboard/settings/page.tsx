// app/[lang]/dashboard/settings/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams } from 'next/navigation'
import { SettingsSidebar } from "@/components/settings/sidebar"
import { GeneralTab } from "@/components/settings/general-tab"
import { SecurityTab } from "@/components/settings/security-tab"
import { VerificationTab } from "@/components/settings/verification-tab"
import { NotificationsTab } from "@/components/settings/notifications-tab"
import { PreferencesTab } from "@/components/settings/preferences-tab"
import { BillingTab } from "@/components/settings/billing-tab"
import { SkillsTab } from "@/components/settings/skills-tab"
import { PortfolioTab } from "@/components/settings/portfolio-tab"
import { AccountTab } from "@/components/settings/account-tab"
import type { Locale } from '@/lib/i18n/config'
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Lock, ShieldCheck, Bell, Globe, CreditCard, Briefcase, Zap, Trash2, GraduationCap, Languages } from "lucide-react"
import { EducationTab } from "@/components/settings/education-tab"
import { LanguagesTab } from "@/components/settings/languages-tab"

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const params = useParams()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("general")
  const [isMounted, setIsMounted] = useState(false)
  const [currentLang, setCurrentLang] = useState<Locale>(lang)

  // Recharger le dictionnaire quand la langue change
  useEffect(() => {
    setIsMounted(true)
    getDictionarySafe(currentLang).then(setDict)
  }, [currentLang])

  // Mettre à jour la langue quand les params changent
  useEffect(() => {
    setCurrentLang(lang)
  }, [lang])

  // Fonction appelée quand la langue change dans PreferencesTab
  const handleLanguageChange = (newLang: Locale) => {
    setCurrentLang(newLang)
    // Mettre à jour l'URL pour refléter le changement
    const newUrl = `/${newLang}/dashboard/settings`
    window.location.href = newUrl
  }

  if (!isMounted || !dict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {dict?.settings?.loading || 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: "general", label: dict.settings.tabs.general, icon: User },
    { id: "skills", label: dict.settings.tabs.skills, icon: Zap },
    { id: "portfolio", label: dict.settings.tabs.portfolio, icon: Briefcase },
    { id: "education", label: dict.settings.tabs.education, icon: GraduationCap },
    { id: "languages", label: dict.settings.tabs.languages, icon: Languages },
    { id: "security", label: dict.settings.tabs.security, icon: Lock },
    { id: "verification", label: dict.settings.tabs.verification, icon: ShieldCheck },
    { id: "notifications", label: dict.settings.tabs.notifications, icon: Bell },
    { id: "preferences", label: dict.settings.tabs.preferences, icon: Globe },
    { id: "billing", label: dict.settings.tabs.billing, icon: CreditCard },
    { id: "account", label: dict.settings.tabs.account, icon: Trash2 },
  ]

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
      <div className="flex-1 flex">
        {/* Sidebar des paramètres */}
        <SettingsSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          tabs={tabs}
          dict={dict}
          lang={currentLang}
        />

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-4xl">
            {/* Language Switcher */}
            <div className="flex justify-end mb-4">
              <LanguageSwitcher lang={currentLang} />
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                {dict.settings.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {dict.settings.subtitle}
              </p>
            </div>

            {/* Version mobile avec onglets */}
            <div className="lg:hidden mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 gap-2 h-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex flex-col items-center gap-1 h-auto py-3 px-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{tab.label}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </Tabs>
            </div>

            {/* Contenu des onglets */}
            <div className="space-y-6">
              {activeTab === "general" && <GeneralTab user={user} dict={dict} lang={currentLang} />}
              {activeTab === "skills" && <SkillsTab user={user} dict={dict.onboardingPage.skills} lang={currentLang} />}
              {activeTab === "portfolio" && <PortfolioTab user={user} dict={dict} lang={currentLang} />}
              {activeTab === "education" && <EducationTab user={user} dict={dict} lang={currentLang} onUpdate={() => {}} />}
              {activeTab === "languages" && <LanguagesTab user={user} dict={dict} lang={currentLang} onUpdate={() => {}} />}
              {activeTab === "security" && <SecurityTab dict={dict} lang={currentLang} />}
              {activeTab === "verification" && <VerificationTab user={user} dict={dict} lang={currentLang} />}
              {activeTab === "notifications" && <NotificationsTab dict={dict} lang={currentLang} />}
              {activeTab === "preferences" && (
                <PreferencesTab 
                  dict={dict} 
                  lang={currentLang} 
                  onLanguageChange={handleLanguageChange}
                />
              )}
              {activeTab === "billing" && <BillingTab dict={dict} lang={currentLang} />}
              {activeTab === "account" && <AccountTab dict={dict} lang={currentLang} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}