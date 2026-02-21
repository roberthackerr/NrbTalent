
"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SettingsSidebar } from "@/components/settings/sidebar"
import { GeneralTab } from "@/components/settings/general-tab"
import { SecurityTab } from "@/components/settings/security-tab"
import { VerificationTab } from "@/components/settings/verification-tab"
import { NotificationsTab } from "@/components/settings/notifications-tab"
import { PreferencesTab } from "@/components/settings/preferences-tab"
import { BillingTab } from "@/components/settings/billing-tab"
import { SkillsTab } from "@/components/settings/skills-tab"
import { PortfolioTab } from "@/components/settings/portfolio-tab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Lock, ShieldCheck, Bell, Globe, CreditCard, Briefcase, Zap } from "lucide-react"

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [activeTab, setActiveTab] = useState("general")

const tabs = [
  { id: "general", label: "Général", icon: User },
  { id: "skills", label: "Compétences", icon: Zap },
  { id: "portfolio", label: "Portfolio", icon: Briefcase },
  { id: "security", label: "Sécurité", icon: Lock },
  { id: "verification", label: "Vérification", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Préférences", icon: Globe },
  { id: "billing", label: "Facturation", icon: CreditCard },
]

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/20">
       {/* <DashboardSidebar role={user?.role || "freelance"} /> */}


      <div className="flex-1 flex">
        {/* Sidebar des paramètres */}
        <SettingsSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          tabs={tabs}
        />

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Paramètres
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Gérez les paramètres de votre compte et vos préférences
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
              {activeTab === "general" && <GeneralTab user={user} />}
              {activeTab === "security" && <SecurityTab />}
              {activeTab === "verification" && <VerificationTab user={user} />}
              {activeTab === "notifications" && <NotificationsTab />}
              {activeTab === "preferences" && <PreferencesTab />}
              {activeTab === "billing" && <BillingTab />}
              {activeTab === "skills" && <SkillsTab user={user} />}
{activeTab === "portfolio" && <PortfolioTab user={user} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}