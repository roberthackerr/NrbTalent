// app/[lang]/ide/page.tsx
'use client'

import { useState, useEffect, useCallback, useRef, JSX } from "react"
import { useParams, useRouter } from "next/navigation"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Code2, 
  Download, 
  Upload, 
  Share2, 
  Settings,
  Play,
  Square,
  Cloud,
  Users,
  Zap,
  Cpu,
  Database,
  Terminal,
  GitBranch,
  Sparkles,
  Rocket,
  Shield,
  Crown,
  Star,
  Gem,
  Infinity,
  Sparkle,
  Brain,
  Network,
  Globe,
  Lock,
  Key,
  Fingerprint,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Plus,
  X,
  FolderTree,
  FileCode,
  Search,
  Bookmark,
  Bell,
  MessageSquare,
  Heart,
  Award,
  Trophy,
  Medal,
  Target,
  Compass,
  Layers,
  Layout,
  PanelTop,
  PanelRight,
  PanelLeft,
  PanelBottom,
  Paintbrush,
  Palette,
  Brush,
  Wand2,
  Activity,
  BarChart3,
  Clock,
  Coffee,
  GitFork,
  Server,
  HardDrive,
  Wifi,
  WifiOff,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
interface FileItem {
  name: string
  type: "folder" | "file"
  expanded?: boolean
  active?: boolean
  children?: FileItem[]
}

interface Project {
  id: string
  name: string
  description: string
  type: "fullstack" | "frontend" | "backend" | "mobile" | "ai"
  stack: string[]
  color: string
  gradient: string
  icon: any
  stats: {
    lines: number
    files: number
    lastEdited: string
    commits: number
    branches: number
  }
  preview?: string
}

export default function ProfessionalIDEPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as Locale
  
  const [dict, setDict] = useState<any>(null)
  const [activeProject, setActiveProject] = useState("nrb-talents")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTerminal, setShowTerminal] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deployProgress, setDeployProgress] = useState(0)
  const [activeFile, setActiveFile] = useState("app/page.tsx")
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 })
  const [isTyping, setIsTyping] = useState(false)
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "> ╔══════════════════════════════════════════════════════════════╗",
    "> ║              NRB TALENTS PROFESSIONAL IDE v3.0               ║",
    "> ╚══════════════════════════════════════════════════════════════╝",
    "> ",
    "> 🔥 Initialisation de l'environnement de développement...",
    "> 📦 Chargement des dépendances...",
    "> 🚀 Serveur de développement démarré sur http://localhost:3000",
    "> ✨ Prêt à coder !",
    "> ",
    "> 💡 Astuce: Utilisez Ctrl+S pour sauvegarder, Ctrl+Shift+P pour les commandes"
  ])

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
      description: "Plateforme de mise en relation freelances/clients avec intelligence artificielle et matching avancé",
      type: "fullstack",
      color: "from-purple-600 to-pink-600",
      gradient: "bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500",
      icon: Crown,
      stack: ["Next.js 14", "TypeScript", "Tailwind CSS", "MongoDB", "AI Matching", "Redis", "WebSocket"],
      stats: {
        lines: 15234,
        files: 128,
        lastEdited: "Il y a 2 minutes",
        commits: 342,
        branches: 8
      },
      preview: "https://via.placeholder.com/800x400/1a1a2e/ffffff?text=NRB+Talents+Preview"
    },
    "ai-matching": {
      id: "ai-matching",
      name: "AI Matching Engine",
      description: "Moteur de recommandation basé sur l'IA avec apprentissage profond et analyse comportementale",
      type: "ai",
      color: "from-violet-600 to-fuchsia-600",
      gradient: "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500",
      icon: Brain,
      stack: ["Python", "TensorFlow", "FastAPI", "MongoDB", "Redis", "PyTorch"],
      stats: {
        lines: 8432,
        files: 67,
        lastEdited: "Il y a 15 minutes",
        commits: 156,
        branches: 5
      }
    },
    "react-dashboard": {
      id: "react-dashboard",
      name: "Analytics Dashboard",
      description: "Tableau de bord analytique avec visualisations avancées et rapports en temps réel",
      type: "frontend",
      color: "from-indigo-600 to-purple-600",
      gradient: "bg-gradient-to-br from-indigo-600 via-purple-500 to-purple-600",
      icon: Layout,
      stack: ["React 18", "TypeScript", "Chart.js", "Recharts", "Tailwind", "D3.js"],
      stats: {
        lines: 5234,
        files: 45,
        lastEdited: "Il y a 1 heure",
        commits: 89,
        branches: 4
      }
    },
    "node-api": {
      id: "node-api",
      name: "Scalable API",
      description: "API REST scalable avec authentification avancée et rate limiting",
      type: "backend",
      color: "from-purple-700 to-indigo-700",
      gradient: "bg-gradient-to-br from-purple-700 via-indigo-600 to-purple-700",
      icon: Network,
      stack: ["Node.js", "Express", "MongoDB", "Redis", "JWT", "Swagger"],
      stats: {
        lines: 6789,
        files: 52,
        lastEdited: "Il y a 30 minutes",
        commits: 203,
        branches: 6
      }
    }
  }

  const currentProject = projects[activeProject]

  const fileStructure: FileItem[] = [
    { name: "src", type: "folder", expanded: true, children: [
      { name: "app", type: "folder", expanded: true, children: [
        { name: "page.tsx", type: "file", active: activeFile === "app/page.tsx" },
        { name: "layout.tsx", type: "file", active: activeFile === "app/layout.tsx" },
        { name: "globals.css", type: "file", active: activeFile === "app/globals.css" }
      ]},
      { name: "components", type: "folder", expanded: false, children: [
        { name: "Header.tsx", type: "file" },
        { name: "Sidebar.tsx", type: "file" }
      ]},
      { name: "lib", type: "folder", expanded: false, children: [
        { name: "utils.ts", type: "file" },
        { name: "api.ts", type: "file" }
      ]}
    ]},
    { name: "package.json", type: "file" },
    { name: "tsconfig.json", type: "file" },
    { name: "README.md", type: "file" }
  ]

  // FIX: renderFileTree now returns a single wrapping fragment instead of JSX.Element[]
  const renderFileTree = (items: FileItem[], level = 0): JSX.Element => {
    return (
      <>
        {items.map((item, idx) => (
          <div key={idx} style={{ paddingLeft: `${level * 16}px` }}>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200",
                item.type === "file" && item.active
                  ? "bg-gradient-to-r from-purple-600/50 to-pink-600/50 text-white"
                  : "hover:bg-purple-500/20 text-purple-300",
                item.type === "folder" && "font-medium"
              )}
              onClick={() => item.type === "file" && setActiveFile(item.name)}
            >
              {item.type === "folder" && (
                <ChevronRight className={cn("h-3 w-3 transition-transform", item.expanded && "rotate-90")} />
              )}
              {item.type === "file" ? (
                <FileCode className="h-3 w-3" />
              ) : (
                <FolderTree className="h-3 w-3" />
              )}
              <span className="text-sm">{item.name}</span>
            </div>
            {item.type === "folder" && item.expanded && item.children && (
              <div>{renderFileTree(item.children, level + 1)}</div>
            )}
          </div>
        ))}
      </>
    )
  }

  const addTerminalLine = (line: string) => {
    setTerminalLines(prev => [...prev, `> ${line}`])
  }

  const handleRun = async () => {
    setIsRunning(true)
    addTerminalLine("🚀 Lancement du serveur de développement...")
    await new Promise(resolve => setTimeout(resolve, 1500))
    addTerminalLine("✅ Serveur démarré sur http://localhost:3000")
    addTerminalLine("📝 Prêt à coder !")
    setIsRunning(false)
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeployProgress(0)
    addTerminalLine("☁️ Préparation du déploiement...")
    
    const steps = [
      { progress: 20, message: "📦 Construction de l'application..." },
      { progress: 40, message: "🔍 Exécution des tests..." },
      { progress: 60, message: "🚀 Déploiement sur les serveurs..." },
      { progress: 80, message: "🌐 Configuration du CDN..." },
      { progress: 100, message: "✅ Déploiement réussi ! URL: https://nrb-talents.vercel.app" }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setDeployProgress(step.progress)
      addTerminalLine(step.message)
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

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 500)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!dict || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-purple-400 animate-pulse" />
              </div>
            </div>
            <p className="text-purple-300 font-medium animate-pulse">
              {dict?.common?.loading || "Chargement de l'environnement..."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const t = dict?.ide || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600 rounded-full blur-[128px] opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500 rounded-full blur-[150px] opacity-10"></div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full animate-ping"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${2 + Math.random() * 3}s`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.3
            }}
          />
        ))}
        
        {/* Animated grid */}
<div className="absolute inset-0 opacity-30" style={{
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(168,85,247,0.15)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E\")"
}} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-2xl opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse"></div>
          <div className="relative bg-purple-950/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-xl animate-pulse"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Code2 className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                    {t.title || "IDE Professionnel"}
                  </h1>
                  <p className="text-purple-300/70 mt-1 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {t.subtitle || "Environnement de développement complet dans le cloud"}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Upload, label: t.import || "Importer" },
                  { icon: Download, label: t.export || "Exporter" },
                  { icon: Share2, label: t.share || "Partager" }
                ].map((action, i) => (
                  <Button 
                    key={i}
                    variant="outline" 
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 gap-2 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                ))}
                <Button 
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 gap-2 transition-all duration-300 hover:scale-105"
                >
                  {isDeploying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Cloud className="h-4 w-4" />
                  )}
                  {t.deploy || "Déployer"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Cpu, value: "2.4GHz", label: "CPU" },
            { icon: Database, value: "8GB", label: "RAM" },
            { icon: Zap, value: "500ms", label: "Latence" },
            { icon: Users, value: "3", label: "Collaborateurs" }
          ].map((stat, i) => (
            <Card 
              key={i} 
              className="relative overflow-hidden bg-purple-950/40 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group cursor-pointer hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-4 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-purple-300/70">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects Section */}
        <Card className="bg-purple-950/40 backdrop-blur-xl border-purple-500/30 shadow-2xl mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500 rounded-full blur-[100px] opacity-20 animate-pulse delay-700"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-purple-400" />
              {t.projects || "Projets"}
            </CardTitle>
            <CardDescription className="text-purple-300/70">
              {t.projectsDesc || "Sélectionnez un projet pour commencer à coder"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeProject} onValueChange={setActiveProject}>
              <TabsList className="grid w-full grid-cols-4 bg-purple-900/50 p-1 rounded-xl">
                {Object.entries(projects).map(([key, project]) => {
                  const Icon = project.icon
                  return (
                    <TabsTrigger 
                      key={key} 
                      value={key}
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-purple-300 transition-all duration-300"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{project.name}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {Object.entries(projects).map(([key, project]) => (
                <TabsContent key={key} value={key} className="space-y-6 mt-6">
                  {/* Project Header */}
                  <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${project.gradient} p-6 transform transition-all duration-500 hover:scale-[1.02]`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-500"></div>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                          <project.icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">{project.name}</h3>
                        <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                          {project.type === "fullstack" && "Full Stack"}
                          {project.type === "frontend" && "Frontend"}
                          {project.type === "backend" && "Backend"}
                          {project.type === "ai" && "AI/ML"}
                        </Badge>
                      </div>
                      <p className="text-white/80 mb-4 max-w-2xl">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.stack.map((tech, i) => (
                          <Badge key={i} className="bg-white/20 text-white border-0 backdrop-blur-sm hover:bg-white/30 transition-all">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { icon: FileCode, value: project.stats.lines.toLocaleString(), label: t.linesOfCode || "Lignes de code" },
                      { icon: FolderTree, value: project.stats.files, label: t.files || "Fichiers" },
                      { icon: Clock, value: project.stats.lastEdited, label: t.lastEdit || "Dernière modif" },
                      { icon: GitBranch, value: project.stats.commits, label: "Commits" },
                      { icon: GitFork, value: project.stats.branches, label: "Branches" }
                    ].map((stat, i) => (
                      <div key={i} className="bg-purple-900/30 rounded-lg p-3 text-center hover:bg-purple-800/40 transition-all duration-300 group">
                        <stat.icon className="h-5 w-5 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-xl font-bold text-white">{stat.value}</div>
                        <div className="text-xs text-purple-300/70">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleRun} 
                      disabled={isRunning}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-105"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t.running || "Démarrage..."}
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          {t.run || "Exécuter"}
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleDeploy} 
                      disabled={isDeploying}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t.deploying || "Déploiement..."}
                        </>
                      ) : (
                        <>
                          <Rocket className="h-4 w-4 mr-2" />
                          {t.deploy || "Déployer"}
                        </>
                      )}
                    </Button>
                  </div>

                  {isDeploying && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-purple-300">
                        <span>{t.deployProgress || "Progression"}</span>
                        <span className="font-mono">{deployProgress}%</span>
                      </div>
                      <Progress value={deployProgress} className="h-2 bg-purple-900/50" />
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Main IDE Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Explorer Sidebar */}
          {showSidebar && (
            <Card className="lg:col-span-1 bg-purple-950/40 backdrop-blur-xl border-purple-500/30 overflow-hidden">
              <CardHeader className="pb-2 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-purple-400" />
                    {t.explorer || "Explorateur"}
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowSidebar(false)}>
                    <X className="h-3 w-3 text-purple-400" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-[500px]">
                  {/* FIX: renderFileTree now returns a single JSX.Element (fragment), valid here */}
                  {renderFileTree(fileStructure)}
                  <div className="mt-4 pt-3 border-t border-purple-500/20">
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-500/20 cursor-pointer transition-all group">
                      <Plus className="h-3 w-3 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm text-purple-300">{t.newFile || "Nouveau fichier"}</span>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Code Editor */}
          <Card className={cn(
            "bg-purple-950/40 backdrop-blur-xl border-purple-500/30 overflow-hidden",
            showSidebar ? "lg:col-span-2" : "lg:col-span-3"
          )}>
            <CardHeader className="pb-2 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!showSidebar && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSidebar(true)}>
                      <PanelRight className="h-4 w-4 text-purple-400" />
                    </Button>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg"></div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <FileCode className="h-3 w-3 text-purple-400" />
                    <span className="text-sm text-purple-300 font-mono">{activeFile}</span>
                    {isTyping && (
                      <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1"></span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
                    <span>Ln {cursorPosition.line}</span>
                    <span>Col {cursorPosition.col}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize2 className="h-3 w-3 text-purple-400" /> : <Maximize2 className="h-3 w-3 text-purple-400" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <iframe
                  src="https://jam004-nrbtalents.hf.space"
                  className="w-full h-[500px] border-0"
                  style={{ background: '#0a0a1a' }}
                  title="IDE Editor"
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-purple-300">
                    TypeScript • React • Tailwind
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terminal */}
          <Card className="lg:col-span-1 bg-purple-950/40 backdrop-blur-xl border-purple-500/30 overflow-hidden">
            <CardHeader className="pb-2 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-purple-400" />
                  {t.terminal || "Terminal"}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => setTerminalLines([])}
                >
                  <X className="h-3 w-3 text-purple-400" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <ScrollArea className="h-[500px]">
                <div className="font-mono text-xs space-y-0.5">
                  {terminalLines.map((line, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "text-purple-300/80 py-0.5",
                        line.includes("✅") && "text-green-400",
                        line.includes("🔥") && "text-yellow-400",
                        line.includes("🚀") && "text-blue-400",
                        line.includes("✨") && "text-purple-400"
                      )}
                    >
                      {line}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-purple-500/20">
                    <span className="text-purple-400">$</span>
                    <span className="text-white/60 animate-pulse">_</span>
                  </div>
                </div>
              </ScrollArea>
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 border-purple-500/50 text-purple-300 text-xs hover:bg-purple-500/20"
                  onClick={() => setTerminalLines([])}
                >
                  {t.clearAll || "Tout effacer"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 border-purple-500/50 text-purple-300 text-xs hover:bg-purple-500/20"
                  onClick={() => addTerminalLine(new Date().toLocaleTimeString() + " - Command executed")}
                >
                  {t.clear || "Effacer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[
            { icon: Cloud, title: t.cloudNative || "Cloud Native", desc: t.cloudDesc || "Développez dans le cloud avec sauvegarde automatique" },
            { icon: Users, title: t.collaboration || "Collaboration", desc: t.collabDesc || "Travaillez en équipe en temps réel" },
            { icon: Rocket, title: t.instantDeploy || "Déploiement Instantané", desc: t.deployDesc || "Déployez en un clic sur nos infrastructures" }
          ].map((feature, i) => (
            <Card 
              key={i} 
              className="bg-gradient-to-br from-purple-800/20 to-purple-900/20 border-purple-500/30 backdrop-blur-sm group cursor-pointer overflow-hidden relative hover:scale-105 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-6 text-center relative">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-7 w-7 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-2 text-lg">{feature.title}</h3>
                <p className="text-sm text-purple-300/70">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 3s ease infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  )
}