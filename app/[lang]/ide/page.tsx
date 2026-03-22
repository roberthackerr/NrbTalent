// app/[lang]/ide/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useTheme } from "next-themes"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import {
  Code2, Download, Cloud, Users, Zap, Cpu, Database,
  GitBranch, Sparkles, Rocket, Crown, Brain, Network, Layout,
  Maximize2, Minimize2, FileCode, FolderTree, GitFork, Clock,
  Loader2, Play, Sun, Moon, X, ChevronDown, BarChart3,
  Construction, Bell, CheckCircle2, ArrowUpFromLine,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Project {
  id: string
  name: string
  description: string
  type: "fullstack" | "frontend" | "backend" | "mobile" | "ai"
  stack: string[]
  gradient: string
  icon: any
  stats: { lines: number; files: number; lastEdited: string; commits: number; branches: number }
}

const gridBg = "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(139,92,246,0.12)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E\")"

const PROJECTS: Record<string, Project> = {
  "nrb-talents": {
    id: "nrb-talents", name: "NRB Talents",
    description: "Plateforme freelances/clients avec IA et matching avancé",
    type: "fullstack", gradient: "from-purple-600 via-violet-500 to-pink-500",
    icon: Crown,
    stack: ["Next.js 14", "TypeScript", "Tailwind CSS", "MongoDB", "Redis", "WebSocket"],
    stats: { lines: 15234, files: 128, lastEdited: "2 min", commits: 342, branches: 8 },
  },
  "ai-matching": {
    id: "ai-matching", name: "AI Matching Engine",
    description: "Moteur de recommandation IA avec apprentissage profond",
    type: "ai", gradient: "from-violet-600 via-fuchsia-500 to-pink-500",
    icon: Brain,
    stack: ["Python", "TensorFlow", "FastAPI", "MongoDB", "Redis", "PyTorch"],
    stats: { lines: 8432, files: 67, lastEdited: "15 min", commits: 156, branches: 5 },
  },
  "react-dashboard": {
    id: "react-dashboard", name: "Analytics Dashboard",
    description: "Tableau de bord analytique avec visualisations avancées",
    type: "frontend", gradient: "from-indigo-600 via-purple-500 to-violet-600",
    icon: Layout,
    stack: ["React 18", "TypeScript", "Chart.js", "Recharts", "Tailwind", "D3.js"],
    stats: { lines: 5234, files: 45, lastEdited: "1 h", commits: 89, branches: 4 },
  },
  "node-api": {
    id: "node-api", name: "Scalable API",
    description: "API REST scalable avec auth avancée et rate limiting",
    type: "backend", gradient: "from-purple-700 via-indigo-600 to-violet-700",
    icon: Network,
    stack: ["Node.js", "Express", "MongoDB", "Redis", "JWT", "Swagger"],
    stats: { lines: 6789, files: 52, lastEdited: "30 min", commits: 203, branches: 6 },
  },
}

// Features coming soon list
const COMING_SOON = [
  { icon: "🤖", label: "AI Code Completion",       eta: "Q2 2025" },
  { icon: "🔴", label: "Live Collaboration",        eta: "Q2 2025" },
  { icon: "📊", label: "Real-time Analytics",       eta: "Q3 2025" },
  { icon: "🐳", label: "Docker Integration",        eta: "Q3 2025" },
  { icon: "🔐", label: "Advanced Secret Manager",   eta: "Q4 2025" },
  { icon: "📱", label: "Mobile App Preview",        eta: "Q4 2025" },
]

export default function ProfessionalIDEPage() {
  const params = useParams()
  const lang = params.lang as Locale
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [dict, setDict]               = useState<any>(null)
  const [isLoading, setIsLoading]     = useState(true)
  const [activeProject, setActiveProject] = useState("nrb-talents")
  const [isFullscreen, setIsFullscreen]   = useState(false)
  const [isDeploying, setIsDeploying]     = useState(false)
  const [isRunning, setIsRunning]         = useState(false)
  const [isExporting, setIsExporting]     = useState(false)
  const [deployProgress, setDeployProgress] = useState(0)
  const [notified, setNotified]           = useState(false)

  type PopupId = "projects" | "stats" | "deploy" | "comingsoon" | "export" | null
  const [popup, setPopup] = useState<PopupId>(null)

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
    const t = setTimeout(() => setIsLoading(false), 1200)
    return () => clearTimeout(t)
  }, [lang])

  // Show "coming soon" popup automatically on first load (once)
  useEffect(() => {
    if (!isLoading) {
      const shown = sessionStorage.getItem("ide-comingsoon-shown")
      if (!shown) {
        setTimeout(() => setPopup("comingsoon"), 800)
        sessionStorage.setItem("ide-comingsoon-shown", "1")
      }
    }
  }, [isLoading])

  const project = PROJECTS[activeProject]

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
            <p className="text-violet-400/70 text-sm mt-1">Chargement de l'environnement...</p>
          </div>
        </div>
      </div>
    )
  }

  // ── colour tokens ────────────────────────────────────────────────────────
  const bg        = isDark
    ? "linear-gradient(160deg,#0a1628 0%,#12073a 40%,#0d1f4a 70%,#0a1628 100%)"
    : "linear-gradient(160deg,#f3f0ff 0%,#ede9fe 50%,#f5f0ff 100%)"
  const surface   = isDark ? "rgba(15,25,60,0.80)"   : "rgba(255,255,255,0.85)"
  const border    = isDark ? "rgba(139,92,246,0.25)" : "rgba(139,92,246,0.30)"
  const textPri   = isDark ? "#e4d9ff"               : "#2e1065"
  const textSec   = isDark ? "#9d8fcb"               : "#6d28d9"
  const overlayBg = isDark ? "rgba(8,15,45,0.95)"    : "rgba(245,240,255,0.97)"

  const IconBtn = ({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title?: string }) => (
    <button onClick={onClick} title={title}
      className="p-1.5 rounded-lg transition-all hover:opacity-80"
      style={{ background: "rgba(124,58,237,0.15)", border: `1px solid ${border}`, color: textSec }}>
      {children}
    </button>
  )

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

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 py-2.5 flex items-center gap-2"
          style={{ background: surface, borderBottom: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>

          {/* Brand */}
          <div className="flex items-center gap-2 mr-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm hidden sm:inline" style={{
              background: "linear-gradient(90deg,#a78bfa,#f472b6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>NRB IDE</span>
          </div>

          {/* Active project pill */}
          <button
            onClick={() => setPopup(popup === "projects" ? null : "projects")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "linear-gradient(90deg,rgba(124,58,237,0.25),rgba(219,39,119,0.18))", border: `1px solid ${border}`, color: textPri }}>
            <project.icon className="h-3.5 w-3.5" style={{ color: "#a78bfa" }} />
            <span className="hidden sm:inline">{project.name}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {/* Coming soon badge */}
          <button
            onClick={() => setPopup("comingsoon")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
            style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.30)", color: "#fbbf24" }}>
            <Construction className="h-3.5 w-3.5" />
            <span className="hidden md:inline">En développement</span>
          </button>

          <div className="flex-1" />

          {/* Stats */}
          <button
            onClick={() => setPopup(popup === "stats" ? null : "stats")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
            style={{ background: "rgba(124,58,237,0.15)", border: `1px solid ${border}`, color: textSec }}>
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Stats</span>
          </button>

          {/* Run */}
          <button onClick={handleRun} disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(90deg,#16a34a,#059669)", color: "#fff" }}>
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isRunning ? "Running..." : "Run"}</span>
          </button>

          {/* Export */}
          <button onClick={handleExport} disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(90deg,#0369a1,#0891b2)", color: "#fff" }}>
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpFromLine className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isExporting ? "Export..." : "Exporter"}</span>
          </button>

          {/* Deploy */}
          <button onClick={handleDeploy} disabled={isDeploying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(90deg,#7c3aed,#db2777)", color: "#fff" }}>
            {isDeploying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isDeploying ? "Déploiement..." : "Déployer"}</span>
          </button>

          <IconBtn onClick={() => setTheme(isDark ? "light" : "dark")} title="Toggle theme">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </IconBtn>

          <IconBtn onClick={toggleFullscreen} title="Fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </IconBtn>
        </div>

        {/* ── VSCode iframe ─────────────────────────────────────────────────── */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ boxShadow: "inset 0 0 60px rgba(124,58,237,0.10)" }} />
          <iframe
            src="https://jam004-nrbtalents.hf.space"
            className="w-full h-full border-0 block"
            title="VSCode — code-server"
            allow="clipboard-read; clipboard-write"
          />
          {/* Badge */}
          <div className="absolute bottom-4 right-4 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(10,20,60,0.75)", border: "1px solid rgba(124,58,237,0.35)", backdropFilter: "blur(12px)" }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium" style={{ color: "#c4b5fd" }}>Visual Studio Code</span>
            <span className="text-xs opacity-50" style={{ color: "#c4b5fd" }}>· code-server</span>
          </div>
        </div>
      </div>

      {/* ── BACKDROP ─────────────────────────────────────────────────────────── */}
      {popup && (
        <div className="fixed inset-0 z-40"
          style={{ background: "rgba(5,10,30,0.60)", backdropFilter: "blur(4px)" }}
          onClick={() => !isDeploying && !isExporting && setPopup(null)} />
      )}

      {/* ── POPUP: Projects ──────────────────────────────────────────────────── */}
      {popup === "projects" && (
        <div className="fixed top-14 left-4 z-50 w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: overlayBg, border: `1px solid ${border}`, backdropFilter: "blur(24px)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
            <p className="font-semibold text-sm" style={{ color: textPri }}>Changer de projet</p>
            <button onClick={() => setPopup(null)} className="p-1 rounded-lg hover:opacity-70" style={{ color: textSec }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3 space-y-2">
            {Object.entries(PROJECTS).map(([key, p]) => {
              const Icon = p.icon
              const active = key === activeProject
              return (
                <button key={key}
                  onClick={() => { setActiveProject(key); setPopup(null) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-90"
                  style={{
                    background: active ? "linear-gradient(90deg,rgba(124,58,237,0.35),rgba(219,39,119,0.25))" : "rgba(124,58,237,0.08)",
                    border: `1px solid ${active ? "rgba(124,58,237,0.5)" : "transparent"}`,
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: textPri }}>{p.name}</p>
                    <p className="text-xs truncate mt-0.5 opacity-70" style={{ color: textSec }}>{p.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[100px] justify-end">
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

      {/* ── POPUP: Stats ─────────────────────────────────────────────────────── */}
      {popup === "stats" && (
        <div className="fixed top-14 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: overlayBg, border: `1px solid ${border}`, backdropFilter: "blur(24px)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
            <div>
              <p className="font-semibold text-sm" style={{ color: textPri }}>{project.name}</p>
              <p className="text-xs mt-0.5 opacity-70" style={{ color: textSec }}>Statistiques du projet</p>
            </div>
            <button onClick={() => setPopup(null)} className="p-1 rounded-lg hover:opacity-70" style={{ color: textSec }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 px-4 pt-4">
            {[
              { icon: Cpu,      value: "2.4 GHz", label: "CPU" },
              { icon: Database, value: "8 GB",    label: "RAM" },
              { icon: Zap,      value: "500 ms",  label: "Latence" },
              { icon: Users,    value: "3",        label: "Collaborateurs" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(124,58,237,0.12)", border: `1px solid ${border}` }}>
                <s.icon className="h-4 w-4 flex-shrink-0" style={{ color: "#a78bfa" }} />
                <div>
                  <div className="font-bold text-sm" style={{ color: textPri }}>{s.value}</div>
                  <div className="text-xs opacity-60" style={{ color: textSec }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 px-4 py-4">
            {[
              { icon: FileCode,   value: project.stats.lines.toLocaleString(), label: "Lignes" },
              { icon: FolderTree, value: project.stats.files,                  label: "Fichiers" },
              { icon: GitBranch,  value: project.stats.commits,                label: "Commits" },
              { icon: GitFork,    value: project.stats.branches,               label: "Branches" },
              { icon: Clock,      value: project.stats.lastEdited,             label: "Modifié" },
            ].map((s, i) => (
              <div key={i} className="text-center px-2 py-2.5 rounded-xl"
                style={{ background: "rgba(124,58,237,0.08)", border: `1px solid ${border}` }}>
                <s.icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: "#a78bfa" }} />
                <div className="font-bold text-sm" style={{ color: textPri }}>{s.value}</div>
                <div className="text-[10px] opacity-60" style={{ color: textSec }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <p className="text-xs font-medium mb-2 opacity-60" style={{ color: textSec }}>Stack technique</p>
            <div className="flex flex-wrap gap-1.5">
              {project.stack.map(s => (
                <span key={s} className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: "rgba(124,58,237,0.2)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.3)" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP: Deploy ────────────────────────────────────────────────────── */}
      {popup === "deploy" && (
        <div className="fixed top-14 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: overlayBg, border: `1px solid ${border}`, backdropFilter: "blur(24px)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
            <div className="flex items-center gap-2">
              {isDeploying
                ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#a78bfa" }} />
                : <CheckCircle2 className="h-4 w-4 text-green-400" />}
              <p className="font-semibold text-sm" style={{ color: textPri }}>
                {isDeploying ? "Déploiement en cours..." : "Déploiement réussi !"}
              </p>
            </div>
            {!isDeploying && (
              <button onClick={() => setPopup(null)} className="p-1 rounded-lg hover:opacity-70" style={{ color: textSec }}>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="flex justify-between text-xs mb-1" style={{ color: textSec }}>
              <span>Progression</span>
              <span className="font-mono font-semibold" style={{ color: textPri }}>{deployProgress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.2)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${deployProgress}%`, background: "linear-gradient(90deg,#7c3aed,#db2777)" }} />
            </div>
            {[
              { pct: 15,  label: "Préparation des artefacts" },
              { pct: 35,  label: "Construction de l'application" },
              { pct: 55,  label: "Exécution des tests" },
              { pct: 75,  label: "Push vers les serveurs" },
              { pct: 90,  label: "Configuration du CDN" },
              { pct: 100, label: "✅ En ligne · nrb-talents.vercel.app" },
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

      {/* ── POPUP: Export ────────────────────────────────────────────────────── */}
      {popup === "export" && (
        <div className="fixed top-14 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: overlayBg, border: `1px solid ${border}`, backdropFilter: "blur(24px)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: border }}>
            <div className="flex items-center gap-2">
              {isExporting
                ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#38bdf8" }} />
                : <CheckCircle2 className="h-4 w-4 text-green-400" />}
              <p className="font-semibold text-sm" style={{ color: textPri }}>
                {isExporting ? "Export en cours..." : "Export terminé !"}
              </p>
            </div>
            {!isExporting && (
              <button onClick={() => setPopup(null)} className="p-1 rounded-lg hover:opacity-70" style={{ color: textSec }}>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs" style={{ color: textSec }}>
              {isExporting ? "Compression et préparation de l'archive du projet..." : `${project.name}.zip est prêt au téléchargement.`}
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
                Télécharger {project.name}.zip
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── POPUP: Coming Soon ───────────────────────────────────────────────── */}
      {popup === "comingsoon" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: overlayBg, border: `1px solid rgba(251,191,36,0.35)`, backdropFilter: "blur(28px)" }}>

            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 text-center"
              style={{ background: "linear-gradient(160deg,rgba(124,58,237,0.15),rgba(251,191,36,0.10))" }}>
              <button onClick={() => setPopup(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.08)", color: textSec }}>
                <X className="h-4 w-4" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,rgba(251,191,36,0.25),rgba(124,58,237,0.25))", border: "1px solid rgba(251,191,36,0.35)" }}>
                <Construction className="h-8 w-8" style={{ color: "#fbbf24" }} />
              </div>

              <h2 className="text-xl font-bold mb-1" style={{ color: textPri }}>
                Projet en cours de développement
              </h2>
              <p className="text-sm" style={{ color: textSec }}>
                NRB IDE est <span style={{ color: "#fbbf24", fontWeight: 600 }}>activement développé</span>. 
                De nouvelles fonctionnalités arrivent bientôt !
              </p>
            </div>

            {/* Feature list */}
            <div className="px-5 py-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: textSec, opacity: 0.7 }}>
                Fonctionnalités à venir
              </p>
              {COMING_SOON.map((f, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(124,58,237,0.08)", border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg leading-none">{f.icon}</span>
                    <span className="text-sm font-medium" style={{ color: textPri }}>{f.label}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
                    {f.eta}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-5 pb-5 space-y-2.5">
              {!notified ? (
                <button
                  onClick={() => setNotified(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(90deg,#7c3aed,#db2777)", color: "#fff" }}>
                  <Bell className="h-4 w-4" />
                  Me notifier à la disponibilité
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", color: "#4ade80" }}>
                  <CheckCircle2 className="h-4 w-4" />
                  Vous serez notifié(e) dès la disponibilité !
                </div>
              )}
              <button
                onClick={() => setPopup(null)}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(124,58,237,0.12)", border: `1px solid ${border}`, color: textSec }}>
                Continuer vers l'IDE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}