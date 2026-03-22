// app/[lang]/ide/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { getDictionarySafe } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Code2, 
  Download, 
  Upload, 
  Share2, 
  Play,
  Cloud,
  Users,
  Zap,
  Cpu,
  Database,
  Terminal,
  Sparkles,
  Rocket,
  Crown,
  Brain,
  Network,
  Layout,
  FolderTree,
  FileCode,
  Plus,
  X,
  Maximize2,
  Minimize2,
  Loader2,
  Monitor,
  Moon,
  Sun
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Project {
  id: string
  name: string
  description: string
  type: "fullstack" | "frontend" | "backend" | "ai"
  stack: string[]
  icon: any
  url: string
}

export default function ProfessionalIDEPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as Locale
  const { theme, setTheme } = useTheme()
  
  const [dict, setDict] = useState<any>(null)
  const [activeProject, setActiveProject] = useState("nrb-talents")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployProgress, setDeployProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "> ╔══════════════════════════════════════════════════════════════╗",
    "> ║              NRB TALENTS PROFESSIONAL IDE v3.0               ║",
    "> ╚══════════════════════════════════════════════════════════════╝",
    "> ",
    "> 🔥 Initialisation de l'environnement de développement...",
    "> 📦 Chargement des dépendances...",
    "> 🚀 IDE prêt !",
    "> ✨ Bon code !",
  ])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  const projects: Record<string, Project> = {
    "nrb-talents": {
      id: "nrb-talents",
      name: "NRB Talents",
      description: "Plateforme de mise en relation freelances/clients avec intelligence artificielle",
      type: "fullstack",
      icon: Crown,
      url: "https://jam004-nrbtalents.hf.space",
      stack: ["Next.js 14", "TypeScript", "Tailwind CSS", "MongoDB", "AI Matching"]
    },
    "ai-matching": {
      id: "ai-matching",
      name: "AI Matching Engine",
      description: "Moteur de recommandation basé sur l'IA",
      type: "ai",
      icon: Brain,
      url: "https://jam004-nrbtalents.hf.space/ai",
      stack: ["Python", "TensorFlow", "FastAPI", "MongoDB"]
    },
    "react-dashboard": {
      id: "react-dashboard",
      name: "React Dashboard",
      description: "Tableau de bord analytique avec visualisations",
      type: "frontend",
      icon: Layout,
      url: "https://jam004-nrbtalents.hf.space/dashboard",
      stack: ["React 18", "TypeScript", "Chart.js", "Tailwind"]
    },
    "node-api": {
      id: "node-api",
      name: "Node.js API",
      description: "API REST scalable avec authentification",
      type: "backend",
      icon: Network,
      url: "https://jam004-nrbtalents.hf.space/api",
      stack: ["Node.js", "Express", "MongoDB", "JWT"]
    }
  }

  const currentProject = projects[activeProject]

  const addTerminalLine = (line: string) => {
    setTerminalLines(prev => [...prev, `> ${line}`])
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
      { progress: 100, message: "✅ Déploiement réussi !" }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 600))
      setDeployProgress(step.progress)
      addTerminalLine(step.message)
    }
    setIsDeploying(false)
  }

  const toggleFullscreen = () => {
    const container = document.getElementById("ide-container")
    if (!document.fullscreenElement) {
      container?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!dict || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
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
    <div id="ide-container" className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600 rounded-full blur-[128px] opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500 rounded-full blur-[150px] opacity-10"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>
          <div className="relative bg-purple-950/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-xl animate-pulse"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                    <Code2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                    {t.title || "IDE Professionnel"}
                  </h1>
                  <p className="text-purple-300/70 text-sm flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {t.subtitle || "Environnement de développement dans le cloud"}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleTheme}
                  className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                {[
                  { icon: Upload, label: t.import || "Importer" },
                  { icon: Download, label: t.export || "Exporter" },
                  { icon: Share2, label: t.share || "Partager" }
                ].map((action, i) => (
                  <Button 
                    key={i}
                    variant="outline" 
                    size="sm"
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                  >
                    <action.icon className="h-3 w-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
                <Button 
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isDeploying ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Cloud className="h-3 w-3 mr-1" />
                  )}
                  {t.deploy || "Déployer"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Cpu, value: "2.4GHz", label: "CPU" },
            { icon: Database, value: "8GB", label: "RAM" },
            { icon: Zap, value: "500ms", label: "Latence" },
            { icon: Users, value: "3", label: "Collaborateurs" }
          ].map((stat, i) => (
            <Card key={i} className="bg-purple-950/40 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <stat.icon className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-purple-300/70">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects Tabs */}
        <Tabs value={activeProject} onValueChange={setActiveProject} className="mb-6">
          <TabsList className="bg-purple-900/50 p-1 rounded-xl w-full justify-start overflow-x-auto">
            {Object.entries(projects).map(([key, project]) => {
              const Icon = project.icon
              return (
                <TabsTrigger 
                  key={key} 
                  value={key}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-purple-300 text-sm px-4"
                >
                  <Icon className="h-3 w-3 mr-2" />
                  {project.name}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {Object.entries(projects).map(([key, project]) => (
            <TabsContent key={key} value={key} className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <project.icon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{project.name}</h3>
                    <p className="text-purple-300/70 text-sm">{project.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {project.stack.slice(0, 3).map((tech, i) => (
                    <Badge key={i} className="bg-purple-500/20 text-purple-300 border-0">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Main IDE - Full Width Iframe */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar Toggle */}
          <div className="lg:hidden flex justify-end mb-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="border-purple-500/50 text-purple-300"
            >
              <FolderTree className="h-4 w-4 mr-2" />
              {showSidebar ? "Masquer" : "Afficher"} explorateur
            </Button>
          </div>

          {/* File Explorer Sidebar */}
          {showSidebar && (
            <Card className="lg:col-span-1 bg-purple-950/40 backdrop-blur-xl border-purple-500/30">
              <CardHeader className="pb-2 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-purple-400" />
                    {t.explorer || "Explorateur"}
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hidden lg:flex" onClick={() => setShowSidebar(false)}>
                    <X className="h-3 w-3 text-purple-400" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-[calc(100vh-320px)] min-h-[400px]">
                  <div className="space-y-1">
                    {currentProject?.stack.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-500/20 cursor-pointer transition-colors group">
                        <FileCode className="h-3 w-3 text-purple-400" />
                        <span className="text-sm text-purple-300">{file.toLowerCase().replace(/\s/g, '-')}.{file === "Next.js 14" ? "tsx" : file === "TypeScript" ? "ts" : file === "Tailwind CSS" ? "css" : "js"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-purple-500/20">
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-500/20 cursor-pointer">
                      <Plus className="h-3 w-3 text-purple-400" />
                      <span className="text-sm text-purple-300">{t.newFile || "Nouveau fichier"}</span>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Code Editor - Iframe */}
          <Card className={cn(
            "bg-purple-950/40 backdrop-blur-xl border-purple-500/30 overflow-hidden",
            showSidebar ? "lg:col-span-2" : "lg:col-span-3"
          )}>
            <CardHeader className="pb-2 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!showSidebar && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowSidebar(true)}>
                      <FolderTree className="h-3 w-3 text-purple-400" />
                    </Button>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-xs text-purple-300 ml-2">{currentProject?.name}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="h-3 w-3 text-purple-400" /> : <Maximize2 className="h-3 w-3 text-purple-400" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <iframe
                  src={currentProject?.url}
                  className="w-full h-[calc(100vh-280px)] min-h-[500px] border-0"
                  style={{ background: theme === 'dark' ? '#1a1a2e' : '#ffffff' }}
                  title={`${currentProject?.name} IDE`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-purple-300">
                    {currentProject?.stack.slice(0, 3).join(" • ")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terminal */}
          <Card className="lg:col-span-1 bg-purple-950/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader className="pb-2 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-purple-400" />
                  {t.terminal || "Terminal"}
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setTerminalLines([])}>
                  <X className="h-3 w-3 text-purple-400" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px]">
                <div className="font-mono text-xs space-y-0.5">
                  {terminalLines.map((line, i) => (
                    <div key={i} className={cn(
                      "text-purple-300/80 py-0.5",
                      line.includes("✅") && "text-green-400",
                      line.includes("🔥") && "text-yellow-400",
                      line.includes("🚀") && "text-blue-400"
                    )}>
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
                  className="flex-1 border-purple-500/50 text-purple-300 text-xs"
                  onClick={() => setTerminalLines([])}
                >
                  {t.clearAll || "Tout effacer"}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 border-purple-500/50 text-purple-300 text-xs"
                  onClick={() => addTerminalLine(new Date().toLocaleTimeString() + " - Ready")}
                >
                  {t.clear || "Effacer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deploy Progress */}
        {isDeploying && (
          <div className="mt-4 p-4 bg-purple-950/40 backdrop-blur-xl rounded-xl border border-purple-500/30">
            <div className="flex justify-between text-sm text-purple-300 mb-2">
              <span>{t.deployProgress || "Déploiement en cours..."}</span>
              <span className="font-mono">{deployProgress}%</span>
            </div>
            <Progress value={deployProgress} className="h-2 bg-purple-900/50" />
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}