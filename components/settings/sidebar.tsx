"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface SettingsSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  tabs: Tab[]
  dict?: any // Optional dictionary for translations
  lang?: string // Language parameter
}

export function SettingsSidebar({ activeTab, onTabChange, tabs, dict, lang }: SettingsSidebarProps) {
  // Use dictionary if provided, otherwise fallback to default French text
  const title = dict?.settings?.title || "Paramètres"

  return (
    <div className="hidden lg:block w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="p-6">
        <h2 className="sticky text-lg font-semibold mb-6 text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "w-full justify-start gap-3 h-12 px-3 transition-all",
                  activeTab === tab.id
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </Button>
            )
          })}
        </nav>

        {/* Optional language switcher in sidebar */}
        {lang && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 px-3">
              {dict?.common?.language || "Language"}
            </p>
            <div className="flex items-center gap-1 px-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 text-xs",
                  lang === 'fr' && "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                )}
                onClick={() => window.location.href = '/fr/settings'}
              >
                FR
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 text-xs",
                  lang === 'en' && "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                )}
                onClick={() => window.location.href = '/en/settings'}
              >
                EN
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-1 text-xs",
                  lang === 'mg' && "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                )}
                onClick={() => window.location.href = '/mg/settings'}
              >
                MG
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}