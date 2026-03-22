// app/[lang]/ide/page.tsx
'use client'

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { useTheme } from "next-themes"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import {
  Code2, Download, Cloud, Users, Zap, Cpu, Database,
  GitBranch, Sparkles, Rocket, Crown, Brain, Network, Layout,
  Maximize2, Minimize2, FileCode, FolderTree, GitFork, Clock,
  Loader2, Play, Sun, Moon, X, ChevronDown, BarChart3,
  Construction, Bell, CheckCircle2, ArrowUpFromLine, Globe, Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Project {
  id: string
  name: string
  nameEn: string
  nameMg: string
  description: string
  descriptionEn: string
  descriptionMg: string
  type: "fullstack" | "frontend" | "backend" | "mobile" | "ai"
  stack: string[]
  gradient: string
  icon: any
  stats: { lines: number; files: number; lastEdited: string; commits: number; branches: number }
}

const gridBg = "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(139,92,246,0.12)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E\")"

const PROJECTS: Record<string, Project> = {
  "nrb-talents": {
    id: "nrb-talents", name: "NRB Talents", nameEn: "NRB Talents", nameMg: "NRB Talents",
    description: "Plateforme freelances/clients avec IA et matching avancé",
    descriptionEn: "Freelance/client platform with AI and advanced matching",
    descriptionMg: "Sehatra freelance/mpanjifa miaraka amin'ny AI sy fampifanarahana mandroso",
    type: "fullstack", gradient: "from-purple-600 via-violet-500 to-pink-500",
    icon: Crown,
    stack: ["Next.js 14", "TypeScript", "Tailwind CSS", "MongoDB", "Redis", "WebSocket"],
    stats: { lines: 15234, files: 128, lastEdited: "2 min", commits: 342, branches: 8 },
  },
  "ai-matching": {
    id: "ai-matching", name: "AI Matching Engine", nameEn: "AI Matching Engine", nameMg: "Mpandrindra AI",
    description: "Moteur de recommandation IA avec apprentissage profond",
    descriptionEn: "AI recommendation engine with deep learning",
    descriptionMg: "Mpandrindra fanolorana AI miaraka amin'ny fianarana lalina",
    type: "ai", gradient: "from-violet-600 via-fuchsia-500 to-pink-500",
    icon: Brain,
    stack: ["Python", "TensorFlow", "FastAPI", "MongoDB", "Redis", "PyTorch"],
    stats: { lines: 8432, files: 67, lastEdited: "15 min", commits: 156, branches: 5 },
  },
  "react-dashboard": {
    id: "react-dashboard", name: "Analytics Dashboard", nameEn: "Analytics Dashboard", nameMg: "Dashboard Analytics",
    description: "Tableau de bord analytique avec visualisations avancées",
    descriptionEn: "Analytics dashboard with advanced visualizations",
    descriptionMg: "Dashboard analytics miaraka amin'ny fijerena mandroso",
    type: "frontend", gradient: "from-indigo-600 via-purple-500 to-violet-600",
    icon: Layout,
    stack: ["React 18", "TypeScript", "Chart.js", "Recharts", "Tailwind", "D3.js"],
    stats: { lines: 5234, files: 45, lastEdited: "1 h", commits: 89, branches: 4 },
  },
  "node-api": {
    id: "node-api", name: "Scalable API", nameEn: "Scalable API", nameMg: "API Scalable",
    description: "API REST scalable avec auth avancée et rate limiting",
    descriptionEn: "Scalable REST API with advanced auth and rate limiting",
    descriptionMg: "API REST scalable miaraka amin'ny auth mandroso sy rate limiting",
    type: "backend", gradient: "from-purple-700 via-indigo-600 to-violet-700",
    icon: Network,
    stack: ["Node.js", "Express", "MongoDB", "Redis", "JWT", "Swagger"],
    stats: { lines: 6789, files: 52, lastEdited: "30 min", commits: 203, branches: 6 },
  },
}

// Features coming soon list - translated
const COMING_SOON = (dict: any) => dict?.ide?.comingSoon || [
  { icon: "🤖", label: "AI Code Completion", labelEn: "AI Code Completion", labelMg: "Famenoana kaody AI", eta: "Q2 2025" },
  { icon: "🔴", label: "Live Collaboration", labelEn: "Live Collaboration", labelMg: "Fiaraha-miasa mivantana", eta: "Q2 2025" },
  { icon: "📊", label: "Real-time Analytics", labelEn: "Real-time Analytics", labelMg: "Analytics mivantana", eta: "Q3 2025" },
  { icon: "🐳", label: "Docker Integration", labelEn: "Docker Integration", labelMg: "Fampidirana Docker", eta: "Q3 2025" },
  { icon: "🔐", label: "Advanced Secret Manager", labelEn: "Advanced Secret Manager", labelMg: "Mpitandrina tsiambaratelo mandroso", eta: "Q4 2025" },
  { icon: "📱", label: "Mobile App Preview", labelEn: "Mobile App Preview", labelMg: "Topi-maso fampiharana finday", eta: "Q4 2025" },
]

export default function ProfessionalIDEPage() {
  const params = useParams()
  const lang = params.lang as Locale
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [dict, setDict] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeProject, setActiveProject] = useState("nrb-talents")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [deployProgress, setDeployProgress] = useState(0)
  const [notified, setNotified] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  type PopupId = "projects" | "stats" | "deploy" | "comingsoon" | "export" | null
  const [popup, setPopup] = useState<PopupId>(null)

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
    const t = setTimeout(() => setIsLoading(false), 1200)
    return () => clearTimeout(t)
  }, [lang])

  // Show "coming soon" popup automatically on first load (once)
  useEffect(() => {
    if (!isLoading && dict) {
      const shown = sessionStorage.getItem("ide-comingsoon-shown")
      if (!shown) {
        setTimeout(() => setPopup("comingsoon"), 800)
        sessionStorage.setItem("ide-comingsoon-shown", "1")
      }
    }
  }, [isLoading, dict])

  const project = PROJECTS[activeProject]
  
  // Get localized project name/description
  const getProjectName = () => {
    if (!dict) return project.name
    if (lang === 'mg') return project.nameMg || project.name
    if (lang === 'en') return project.nameEn || project.name
    return project.name
  }
  
  const getProjectDesc = () => {
    if (!dict) return project.description
    if (lang === 'mg') return project.descriptionMg || project.description
    if (lang === 'en') return project.descriptionEn || project.description
    return project.description
  }

  const handleRun = async () => {
    setIsRunning(true)
    await new Promise(r => setTimeout(r, 1500))
    setIsRunning(false)
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeployProgress(0)
    setPopup("deploy")
    for (const pct of [15, 35, 55, 75, 90, 100]) {
      await new Promise(r => setTimeout(r, 700))
      setDeployProgress(pct)
    }
    setIsDeploying(false)
  }

  const handleExport = async () => {
    setIsExporting(true)
    setPopup("export")
    await new Promise(r => setTimeout(r, 2000))
    setIsExporting(false)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#0a1628 0%,#1a0a3c 50%,#0d1b3e 100%)" }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-violet-500/30 border-t-violet-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Code2 className="h-7 w-7 text-violet-400 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-violet-200 font-semibold text-lg">NRB IDE</p>
            <p className="text-violet-400/70 text-sm mt-1">
              {dict?.ide?.loading || "Chargement de l'environnement..."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── colour tokens ────────────────────────────────────────────────────────
  const bg = isDark
    ? "linear-gradient(160deg,#0a1628 0%,#12073a 40%,#0d1f4a 70%,#0a1628 100%)"
    : "linear-gradient(160deg,#f3f0ff 0%,#ede9fe 50%,#f5f0ff 100%)"
  const surface = isDark ? "rgba(15,25,60,0.80)" : "rgba(255,255,255,0.85)"
  const border = isDark ? "rgba(139,92,246,0.25)" : "rgba(139,92,246,0.30)"
  const textPri = isDark ? "#e4d9ff" : "#2e1065"
  const textSec = isDark ? "#9d8fcb" : "#6d28d9"
  const overlayBg = isDark ? "rgba(8,15,45,0.95)" : "rgba(245,240,255,0.97)"

  const IconBtn = ({ onClick, children, title, className = "" }: { onClick: () => void; children: React.ReactNode; title?: string; className?: string }) => (
    <button onClick={onClick} title={title}
      className={cn("p-1.5 rounded-lg transition-all hover:opacity-80", className)}
      style={{ background: "rgba(124,58,237,0.15)", border: `1px solid ${border}`, color: textSec }}>
      {children}
    </button>
  )

  const ActionBtn = ({ onClick, children, disabled, gradient, title }: { onClick: () => void; children: React.ReactNode; disabled?: boolean; gradient?: string; title?: string }) => (
    <button onClick={onClick} disabled={disabled} title={title}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
      style={{ background: gradient || "linear-gradient(90deg,#7c3aed,#db2777)", color: "#fff" }}>
      {children}
    </button>
  )

  const comingSoonList = dict?.ide?.comingSoon || COMING_SOON(dict)

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: bg }}>

      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-60" style={{ backgroundImage: gridBg }} />

      {/* Glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)" }} />
        <div className="absolute bottom-[-5%] right-[15%] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(192,38,211,0.14) 0%,transparent 70%)" }} />
      </div>

      <div className="relative z-10 flex flex-col h-screen">

        {/* ── Top bar (responsive) ───────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 flex-wrap"
          style={{ background: surface, borderBottom: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg"
            style={{ background: "rgba(124,58,237,0.15)", border: `1px solid ${border}`, color: textSec }}
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2 mr-1 sm:mr-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
              <Code2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <span className="font-bold text-xs sm:text-sm hidden xs:inline" style={{
              background: "linear-gradient(90deg,#a78bfa,#f472b6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>NRB IDE</span>
          </div>

          {/* Active project pill - responsive */}
          <button
            onClick={() => setPopup(popup === "projects" ? null : "projects")}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all hover:opacity-90 max-w-[140px] sm:max-w-none"
            style={{ background: "linear-gradient(90deg,rgba(124,58,237,0.25),rgba(219,39,119,0.18))", border: `1px solid ${border}`, color: textPri }}>
            <project.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" style={{ color: "#a78bfa" }} />
            <span className="truncate hidden xs:inline">{getProjectName()}</span>
            <span className="truncate xs:hidden">{getProjectName().slice(0, 12)}</span>
            <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-60 flex-shrink-0" />
          </button>

          {/* Coming soon badge - hide on small screens */}
          <button
            onClick={() => setPopup("comingsoon")}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
            style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.30)", color: "#fbbf24" }}>
            <Construction className="h-3.5 w-3.5" />
            <span>{dict?.ide?.development || "En développement"}</span>
          </button>

          <div className="flex-1" />

          {/* Action Buttons - responsive */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Stats - hide text on mobile */}
            <button
              onClick={() => setPopup(popup === "stats" ? null : "stats")}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
              style={{ background: "rgba(124,58,237,0.15)", border: `1px solid ${border}`, color: textSec }}>
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{dict?.ide?.stats || "Stats"}</span>
            </button>

            {/* Run */}
            <ActionBtn onClick={handleRun} disabled={isRunning} gradient="linear-gradient(90deg,#16a34a,#059669)">
              {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isRunning ? (dict?.ide?.running || "Running...") : (dict?.ide?.run || "Run")}</span>
            </ActionBtn>

            {/* Export */}
            <ActionBtn onClick={handleExport} disabled={isExporting} gradient="linear-gradient(90deg,#0369a1,#0891b2)">
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpFromLine className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isExporting ? (dict?.ide?.exporting || "Export...") : (dict?.ide?.export || "Exporter")}</span>
            </ActionBtn>

            {/* Deploy - hide text on mobile */}
            <ActionBtn onClick={handleDeploy} disabled={isDeploying}>
              {isDeploying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isDeploying ? (dict?.ide?.deploying || "Déploiement...") : (dict?.ide?.deploy || "Déployer")}</span>
            </ActionBtn>

            {/* Theme toggle */}
            <IconBtn onClick={() => setTheme(isDark ? "light" : "dark")} title={dict?.ide?.toggleTheme || "Toggle theme"}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </IconBtn>

            {/* Fullscreen - hide on mobile */}
            <IconBtn onClick={toggleFullscreen} title={dict?.ide?.fullscreen || "Fullscreen"} className="hidden sm:flex">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </IconBtn>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-14 left-0 right-0 z-30 mx-2 rounded-xl shadow-xl overflow-hidden"
            style={{ background: overlayBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>
            <div className="p-3 space-y-2">
              <button
                onClick={() => { setPopup("comingsoon"); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
                style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>
                <Construction className="h-4 w-4" />
                <span>{dict?.ide?.development || "En développement"}</span>
              </button>
              <button
                onClick={() => { toggleFullscreen(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
                style={{ color: textPri }}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                <span>{isFullscreen ? (dict?.ide?.exitFullscreen || "Quitter plein écran") : (dict?.ide?.fullscreen || "Plein écran")}</span>
              </button>
              <button
                onClick={() => { setPopup("stats"); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
                style={{ color: textPri }}>
                <BarChart3 className="h-4 w-4" />
                <span>{dict?.ide?.stats || "Statistiques"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── VSCode iframe (responsive) ─────────────────────────────────────── */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ boxShadow: "inset 0 0 60px rgba(124,58,237,0.10)" }} />
          <iframe
            src="https://jam004-nrbtalents.hf.space"
            className="w-full h-full border-0 block"
            title="VSCode — code-server"
            allow="clipboard-read; clipboard-write"
          />
          {/* Badge - responsive */}
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 pointer-events-none flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full"
            style={{ background: "rgba(10,20,60,0.75)", border: "1px solid rgba(124,58,237,0.35)", backdropFilter: "blur(12px)" }}>
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-medium" style={{ color: "#c4b5fd" }}>VS Code</span>
            <span className="text-[8px] sm:text-xs opacity-50 hidden xs:inline" style={{ color: "#c4b5fd" }}>· code-server</span>
          </div>
        </div>
      </div>

      {/* ── BACKDROP ─────────────────────────────────────────────────────────── */}
      {popup && (
        <div className="fixed inset-0 z-40"
          style={{ background: "rgba(5,10,30,0.60)", backdropFilter: "blur(4px)" }}
          onClick={() => !isDeploying && !isExporting && setPopup(null)} />
      )}

      {/* ── POPUP: Projects (responsive) ─────────────────────────────────────── */}
      {popup === "projects" && (
        <div className="fixed top-14 left-2 right-2 sm:left-4 sm:right-auto z-50 w-[calc(100%-1rem)] sm:w-[420px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: overlayBg, border: `1px solid ${border}`, backdropFilter: "blur(24px)" }}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b" style={{ borderColor: border }}>
            <p className="font-semibold text-sm" style={{ color: textPri }}>{dict?.ide?.switchProject || "Changer de projet"}</p>
            <button onClick={() => setPopup(null)} className="p-1 rounded-lg hover:opacity-70" style={{ color: textSec }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-2 sm:p-3 space-y-2 max-h-[70vh] overflow-y-auto">
            {Object.entries(PROJECTS).map(([key, p]) => {
              const Icon = p.icon
              const active = key === activeProject
              const projName = lang === 'mg' ? (p.nameMg || p.name) : (lang === 'en' ? (p.nameEn || p.name) : p.name)
              const projDesc = lang === 'mg' ? (p.descriptionMg || p.description) : (lang === 'en' ? (p.descriptionEn || p.description) : p.description)
              return (
                <button key={key}
                  onClick={() => { setActiveProject(key); setPopup(null) }}
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-left transition-all hover:opacity-90"
                  style={{
                    background: active ? "linear-gradient(90deg,rgba(124,58,237,0.35),rgba(219,39,119,0.25))" : "rgba(124,58,237,0.08)",
                    border: `1px solid ${active ? "rgba(124,58,237,0.5)" : "transparent"}`,
                  }}>
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs sm:text-sm truncate" style={{ color: textPri }}>{projName}</p>
                    <p className="text-[10px] sm:text-xs truncate mt-0.5 opacity-70" style={{ color: textSec }}>{projDesc}</p>
                  </div>
                  <div className="hidden sm:flex flex-wrap gap-1 max-w-[100px] justify-end">
                    {p.stack.slice(0, 2).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }}>{s}</span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── POPUP: Stats (responsive) ─────────────────────────────────────────── */}
      {popup === "stats" && (
        <div className="fixed top-14 right-2 left-2 sm:left-auto sm:right-4 z-50 w-[calc(100%-1rem)] sm:w-[380px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: overlayBg, border: `1px solid ${border}`, backdropFilter: "blur(24px)" }}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b" style={{ borderColor: border }}>
            <div>
              <p className="font-semibold text-sm" style={{ color: textPri }}>{getProjectName()}</p>
              <p className="text-[10px] sm:text-xs mt-0.5 opacity-70" style={{ color: textSec }}>
                {dict?.ide?.projectStats || "Statistiques du projet"}
              </p>
            </div>
            <button onClick={() => setPopup(null)} className="p-1 rounded-lg hover:opacity-70" style={{ color: textSec }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 px-3 sm:px-4 pt-3 sm:pt-4">
            {[
              { icon: Cpu, value: "2.4 GHz", label: dict?.ide?.cpu || "CPU" },
              { icon: Database, value: "8 GB", label: dict?.ide?.ram || "RAM" },
              { icon: Zap, value: "500 ms", label: dict?.ide?.latency || "Latence" },
              { icon: Users, value: "3", label: dict?.ide?.collaborators || "Collaborateurs" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-xl"
                style={{ background: "rgba(124,58,237,0.12)", border: `1px solid ${border}` }}>
                <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: "#a78bfa" }} />
                <div>
                  <div className="font-bold text-xs sm:text-sm" style={{ color: textPri }}>{s.value}</div>
                  <div className="text-[10px] sm:text-xs opacity-60" style={{ color: textSec }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4">
            {[
              { icon: FileCode, value: project.stats.lines.toLocaleString(), label: dict?.ide?.lines || "Lignes" },
              { icon: FolderTree, value: project.stats.files, label: dict?.ide?.files || "Fichiers" },
              { icon: GitBranch, value: project.stats.commits, label: dict?.ide?.commits || "Commits" },
              { icon: GitFork, value: project.stats.branches, label: dict?.ide?.branches || "Branches" },
              { icon: Clock, value: project.stats.lastEdited, label: dict?.ide?.lastEdit || "Modifié" },
            ].map((s, i) => (
              <div key={i} className="text-center px-1 sm:px-2 py-2 rounded-xl"
                style={{ background: "rgba(124,58,237,0.08)", border: `1px solid ${border}` }}>
                <s.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-auto mb-1" style={{ color: "#a78bfa" }} />
                <div className="font-bold text-[11px] sm:text-sm" style={{ color: textPri }}>{s.value}</div>
                <div className="text-[9px] sm:text-[10px] opacity-60" style={{ color: textSec }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <p className="text-[10px] sm:text-xs font-medium mb-2 opacity-60" style={{ color: textSec }}>
              {dict?.ide?.techStack || "Stack technique"}
            </p>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {project.stack.map(s => (
                <span key={s} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg"
                  style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.3)" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP: Deploy (responsive) ───────────────────────────────────────── */}
      {popup === "deploy" && (
        <div className="fixed top-14 right-2 left-2 sm:left-auto sm:right-4 z-50 w-[calc(100%-1rem)] sm:w-[340px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: overlayBg, border: `1px solid ${border}`, backdropFilter: "blur(24px)" }}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b" style={{ borderColor: border }}>
            <div className="flex items-center gap-2">
              {isDeploying
                ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#a78bfa" }} />
                : <CheckCircle2 className="h-4 w-4 text-green-400" />}
              <p className="font-semibold text-sm" style={{ color: textPri }}>
                {isDeploying ? (dict?.ide?.deploying || "Déploiement en cours...") : (dict?.ide?.deploySuccess || "Déploiement réussi !")}
              </p>
            </div>
            {!isDeploying && (
              <button onClick={() => setPopup(null)} className="p-1 rounded-lg hover:opacity-70" style={{ color: textSec }}>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-3">
            <div className="flex justify-between text-xs mb-1" style={{ color: textSec }}>
              <span>{dict?.ide?.deployProgress || "Progression"}</span>
              <span className="font-mono font-semibold" style={{ color: textPri }}>{deployProgress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.2)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${deployProgress}%`, background: "linear-gradient(90deg,#7c3aed,#db2777)" }} />
            </div>
            {[
              { pct: 15, label: dict?.ide?.stepPrepare || "Préparation des artefacts" },
              { pct: 35, label: dict?.ide?.stepBuild || "Construction de l'application" },
              { pct: 55, label: dict?.ide?.stepTests || "Exécution des tests" },
              { pct: 75, label: dict?.ide?.stepPush || "Push vers les serveurs" },
              { pct: 90, label: dict?.ide?.stepCDN || "Configuration du CDN" },
              { pct: 100, label: dict?.ide?.stepLive || "✅ En ligne · nrb-talents.vercel.app" },
            ].map(step => (
              <div key={step.pct} className="flex items-center gap-2.5 text-xs"
                style={{ color: deployProgress >= step.pct ? textPri : `${textSec}60` }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: deployProgress >= step.pct ? "#a78bfa" : "rgba(124,58,237,0.3)" }} />
                {step.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── POPUP: Export (responsive) ───────────────────────────────────────── */}
      {popup === "export" && (
        <div className="fixed top-14 right-2 left-2 sm:left-auto sm:right-4 z-50 w-[calc(100%-1rem)] sm:w-[340px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: overlayBg, border: `1px solid ${border}`, backdropFilter: "blur(24px)" }}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b" style={{ borderColor: border }}>
            <div className="flex items-center gap-2">
              {isExporting
                ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#38bdf8" }} />
                : <CheckCircle2 className="h-4 w-4 text-green-400" />}
              <p className="font-semibold text-sm" style={{ color: textPri }}>
                {isExporting ? (dict?.ide?.exporting || "Export en cours...") : (dict?.ide?.exportSuccess || "Export terminé !")}
              </p>
            </div>
            {!isExporting && (
              <button onClick={() => setPopup(null)} className="p-1 rounded-lg hover:opacity-70" style={{ color: textSec }}>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-3">
            <p className="text-xs" style={{ color: textSec }}>
              {isExporting 
                ? (dict?.ide?.exportPrepare || "Compression et préparation de l'archive du projet...") 
                : `${getProjectName()}.zip ${dict?.ide?.exportReady || "est prêt au téléchargement."}`}
            </p>
            {isExporting ? (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse"
                style={{ background: "rgba(3,105,161,0.15)", border: "1px solid rgba(14,165,233,0.3)" }}>
                <ArrowUpFromLine className="h-4 w-4 flex-shrink-0" style={{ color: "#38bdf8" }} />
                <div className="space-y-1.5 flex-1">
                  {["app/", "components/", "lib/", "public/", "package.json"].map(f => (
                    <div key={f} className="h-1.5 rounded-full" style={{ background: "rgba(56,189,248,0.3)", width: `${40 + Math.random() * 50}%` }} />
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setPopup(null)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: "linear-gradient(90deg,#0369a1,#0891b2)", color: "#fff" }}>
                <Download className="h-4 w-4" />
                {dict?.ide?.download || "Télécharger"} {getProjectName()}.zip
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── POPUP: Coming Soon (responsive) ──────────────────────────────────── */}
      {popup === "comingsoon" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ background: overlayBg, border: `1px solid rgba(251,191,36,0.35)`, backdropFilter: "blur(28px)" }}>

            {/* Header */}
            <div className="relative px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 text-center"
              style={{ background: "linear-gradient(160deg,rgba(124,58,237,0.15),rgba(251,191,36,0.10))" }}>
              <button onClick={() => setPopup(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-lg hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.08)", color: textSec }}>
                <X className="h-4 w-4" />
              </button>

              {/* Icon */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,rgba(251,191,36,0.25),rgba(124,58,237,0.25))", border: "1px solid rgba(251,191,36,0.35)" }}>
                <Construction className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: "#fbbf24" }} />
              </div>

              <h2 className="text-lg sm:text-xl font-bold mb-1" style={{ color: textPri }}>
                {dict?.ide?.devInProgress || "Projet en cours de développement"}
              </h2>
              <p className="text-xs sm:text-sm" style={{ color: textSec }}>
                {dict?.ide?.devDescription || "NRB IDE est"} <span style={{ color: "#fbbf24", fontWeight: 600 }}>
                  {dict?.ide?.activelyDeveloped || "activement développé"}</span>. 
                {dict?.ide?.newFeatures || "De nouvelles fonctionnalités arrivent bientôt !"}
              </p>
            </div>

            {/* Feature list */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-2">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2 sm:mb-3" style={{ color: textSec, opacity: 0.7 }}>
                {dict?.ide?.upcomingFeatures || "Fonctionnalités à venir"}
              </p>
              {comingSoonList.map((f: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl"
                  style={{ background: "rgba(124,58,237,0.08)", border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg leading-none">{f.icon}</span>
                    <span className="text-xs sm:text-sm font-medium" style={{ color: textPri }}>
                      {lang === 'mg' ? (f.labelMg || f.label) : (lang === 'en' ? (f.labelEn || f.label) : f.label)}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg"
                    style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
                    {f.eta}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2.5">
              {!notified ? (
                <button
                  onClick={() => setNotified(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(90deg,#7c3aed,#db2777)", color: "#fff" }}>
                  <Bell className="h-4 w-4" />
                  {dict?.ide?.notifyMe || "Me notifier à la disponibilité"}
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", color: "#4ade80" }}>
                  <CheckCircle2 className="h-4 w-4" />
                  {dict?.ide?.willNotify || "Vous serez notifié(e) dès la disponibilité !"}
                </div>
              )}
              <button
                onClick={() => setPopup(null)}
                className="w-full py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(124,58,237,0.12)", border: `1px solid ${border}`, color: textSec }}>
                {dict?.ide?.continueToIDE || "Continuer vers l'IDE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}