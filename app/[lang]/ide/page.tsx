// app/[lang]/ide/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Code2,
  Download,
  Upload,
  Share2,
  Cloud,
  Users,
  Zap,
  Cpu,
  Database,
  GitBranch,
  Sparkles,
  Rocket,
  Crown,
  Brain,
  Network,
  Layout,
  Maximize2,
  Minimize2,
  FileCode,
  FolderTree,
  GitFork,
  Clock,
  Loader2,
  Play,
  Sun,
  Moon,
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
  stats: {
    lines: number
    files: number
    lastEdited: string
    commits: number
    branches: number
  }
}

const gridBg = "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(168,85,247,0.15)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E\")"

export default function ProfessionalIDEPage() {
  const params = useParams()
  const lang = params.lang as Locale
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [dict, setDict] = useState<any>(null)
  const [activeProject, setActiveProject] = useState("nrb-talents")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deployProgress, setDeployProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  const projects: Record<string, Project> = {
    "nrb-talents": {
      id: "nrb-talents",
      name: "NRB Talents",
      description: "Plateforme freelances/clients avec IA et matching avancé",
      type: "fullstack",
      gradient: "from-purple-600 via-purple-500 to-pink-500",
      icon: Crown,
      stack: ["Next.js 14", "TypeScript", "Tailwind CSS", "MongoDB", "Redis", "WebSocket"],
      stats: { lines: 15234, files: 128, lastEdited: "Il y a 2 min", commits: 342, branches: 8 },
    },
    "ai-matching": {
      id: "ai-matching",
      name: "AI Matching Engine",
      description: "Moteur de recommandation IA avec apprentissage profond",
      type: "ai",
      gradient: "from-violet-600 via-fuchsia-500 to-pink-500",
      icon: Brain,
      stack: ["Python", "TensorFlow", "FastAPI", "MongoDB", "Redis", "PyTorch"],
      stats: { lines: 8432, files: 67, lastEdited: "Il y a 15 min", commits: 156, branches: 5 },
    },
    "react-dashboard": {
      id: "react-dashboard",
      name: "Analytics Dashboard",
      description: "Tableau de bord analytique avec visualisations avancées",
      type: "frontend",
      gradient: "from-indigo-600 via-purple-500 to-purple-600",
      icon: Layout,
      stack: ["React 18", "TypeScript", "Chart.js", "Recharts", "Tailwind", "D3.js"],
      stats: { lines: 5234, files: 45, lastEdited: "Il y a 1 h", commits: 89, branches: 4 },
    },
    "node-api": {
      id: "node-api",
      name: "Scalable API",
      description: "API REST scalable avec auth avancée et rate limiting",
      type: "backend",
      gradient: "from-purple-700 via-indigo-600 to-purple-700",
      icon: Network,
      stack: ["Node.js", "Express", "MongoDB", "Redis", "JWT", "Swagger"],
      stats: { lines: 6789, files: 52, lastEdited: "Il y a 30 min", commits: 203, branches: 6 },
    },
  }

  const currentProject = projects[activeProject]

  const handleRun = async () => {
    setIsRunning(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsRunning(false)
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeployProgress(0)
    for (const pct of [20, 40, 60, 80, 100]) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setDeployProgress(pct)
    }
    setIsDeploying(false)
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

  if (!dict || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-purple-500 animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">
            {dict?.common?.loading || "Chargement de l'environnement..."}
          </p>
        </div>
      </div>
    )
  }

  const t = dict?.ide || {}

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">

      {/* Subtle background — only visible in dark mode, respects theme */}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[128px] opacity-10" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600 rounded-full blur-[128px] opacity-10" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: gridBg }} />
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-border bg-card/60 backdrop-blur-xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {t.title || "IDE Professionnel"}
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {t.subtitle || "Environnement de développement complet dans le cloud"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Theme toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                title="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {[
                { icon: Upload, label: t.import || "Importer" },
                { icon: Download, label: t.export || "Exporter" },
                { icon: Share2, label: t.share || "Partager" },
              ].map((action, i) => (
                <Button key={i} variant="outline" className="gap-2">
                  <action.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              ))}

              <Button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
              >
                {isDeploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
                {t.deploy || "Déployer"}
              </Button>

              <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* ── System Stats ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Cpu,      value: "2.4 GHz", label: "CPU" },
            { icon: Database, value: "8 GB",    label: "RAM" },
            { icon: Zap,      value: "500 ms",  label: "Latence" },
            { icon: Users,    value: "3",        label: "Collaborateurs" },
          ].map((stat, i) => (
            <Card key={i} className="bg-card border-border hover:border-purple-500/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <stat.icon className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <div className="font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Projects ───────────────────────────────────────────────────── */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              {t.projects || "Projets"}
            </CardTitle>
            <CardDescription>
              {t.projectsDesc || "Sélectionnez un projet pour commencer à coder"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeProject} onValueChange={setActiveProject}>
              <TabsList className="w-full grid grid-cols-4 mb-6">
                {Object.entries(projects).map(([key, project]) => {
                  const Icon = project.icon
                  return (
                    <TabsTrigger key={key} value={key} className="gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{project.name}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {Object.entries(projects).map(([key, project]) => (
                <TabsContent key={key} value={key} className="space-y-5 mt-0">

                  {/* Project banner */}
                  <div className={cn(
                    "relative overflow-hidden rounded-xl p-5 bg-gradient-to-br text-white",
                    project.gradient
                  )}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/10 rounded-xl">
                          <project.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold">{project.name}</h3>
                        <Badge className="bg-white/20 text-white border-0 text-xs">
                          {project.type === "fullstack" && "Full Stack"}
                          {project.type === "frontend"  && "Frontend"}
                          {project.type === "backend"   && "Backend"}
                          {project.type === "ai"        && "AI/ML"}
                        </Badge>
                      </div>
                      <p className="text-white/80 text-sm mb-3">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.stack.map((tech, i) => (
                          <Badge key={i} className="bg-white/20 text-white border-0 text-xs hover:bg-white/30 transition-colors">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Project stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { icon: FileCode,   value: project.stats.lines.toLocaleString(), label: t.linesOfCode || "Lignes" },
                      { icon: FolderTree, value: project.stats.files,                  label: t.files       || "Fichiers" },
                      { icon: Clock,      value: project.stats.lastEdited,             label: t.lastEdit    || "Modifié" },
                      { icon: GitBranch,  value: project.stats.commits,                label: "Commits" },
                      { icon: GitFork,    value: project.stats.branches,               label: "Branches" },
                    ].map((stat, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/40 p-3 text-center">
                        <stat.icon className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                        <div className="font-bold text-foreground text-sm">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleRun}
                      disabled={isRunning}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    >
                      {isRunning ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.running || "Démarrage..."}</>
                      ) : (
                        <><Play className="h-4 w-4 mr-2" />{t.run || "Exécuter"}</>
                      )}
                    </Button>
                    <Button
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {isDeploying ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.deploying || "Déploiement..."}</>
                      ) : (
                        <><Rocket className="h-4 w-4 mr-2" />{t.deploy || "Déployer"}</>
                      )}
                    </Button>
                  </div>

                  {isDeploying && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{t.deployProgress || "Progression"}</span>
                        <span className="font-mono">{deployProgress}%</span>
                      </div>
                      <Progress value={deployProgress} className="h-2" />
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* ── VSCode iframe — full width, tall ───────────────────────────── */}
        <Card className="bg-card border-border overflow-hidden mb-6">
          <CardHeader className="pb-2 border-b border-border py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* macOS traffic lights — cosmetic only */}
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-sm font-medium text-muted-foreground">
                  {currentProject.name} — code-server
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* iframe fills all available height — VS Code inside handles everything */}
            <iframe
              src="https://jam004-nrbtalents.hf.space"
              className="w-full border-0"
              style={{ height: "calc(100vh - 260px)", minHeight: "600px" }}
              title="VSCode — code-server"
              allow="clipboard-read; clipboard-write"
            />
          </CardContent>
        </Card>

        {/* ── Bottom feature cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Cloud,  title: t.cloudNative   || "Cloud Native",           desc: t.cloudDesc  || "Développez dans le cloud avec sauvegarde automatique" },
            { icon: Users,  title: t.collaboration  || "Collaboration",          desc: t.collabDesc || "Travaillez en équipe en temps réel" },
            { icon: Rocket, title: t.instantDeploy  || "Déploiement Instantané", desc: t.deployDesc || "Déployez en un clic sur nos infrastructures" },
          ].map((feature, i) => (
            <Card
              key={i}
              className="bg-card border-border hover:border-purple-500/50 transition-colors group"
            >
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  )
}