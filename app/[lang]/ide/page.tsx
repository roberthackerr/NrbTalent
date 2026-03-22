// app/[lang]/ide/page.tsx
'use client'

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
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
  Wand2
} from "lucide-react"
import { cn } from "@/lib/utils"

// Interface pour les projets
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
  }
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
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "> Initialisation de l'environnement de développement...",
    "> Chargement des dépendances...",
    "> Serveur de développement démarré sur http://localhost:3000",
    "> Prêt à coder !",
  ])
  const [deployProgress, setDeployProgress] = useState(0)

  useEffect(() => {
    getDictionarySafe(lang).then(setDict)
  }, [lang])

  // Projets avec design purple époustouflant
  const projects: Record<string, Project> = {
    "nrb-talents": {
      id: "nrb-talents",
      name: "NRB Talents",
      description: "Plateforme de mise en relation freelances/clients avec intelligence artificielle",
      type: "fullstack",
      color: "from-purple-600 to-pink-600",
      gradient: "bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500",
      icon: Crown,
      stack: ["Next.js 14", "TypeScript", "Tailwind CSS", "MongoDB", "AI Matching"],
      stats: {
        lines: 15234,
        files: 128,
        lastEdited: "Il y a 2 minutes"
      }
    },
    "ai-matching": {
      id: "ai-matching",
      name: "AI Matching Engine",
      description: "Moteur de recommandation basé sur l'IA pour freelances et projets",
      type: "ai",
      color: "from-violet-600 to-fuchsia-600",
      gradient: "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500",
      icon: Brain,
      stack: ["Python", "TensorFlow", "FastAPI", "MongoDB", "Redis"],
      stats: {
        lines: 8432,
        files: 67,
        lastEdited: "Il y a 15 minutes"
      }
    },
    "react-dashboard": {
      id: "react-dashboard",
      name: "Analytics Dashboard",
      description: "Tableau de bord analytique avec visualisations avancées",
      type: "frontend",
      color: "from-indigo-600 to-purple-600",
      gradient: "bg-gradient-to-br from-indigo-600 via-purple-500 to-purple-600",
      icon: Layout,
      stack: ["React 18", "TypeScript", "Chart.js", "Recharts", "Tailwind"],
      stats: {
        lines: 5234,
        files: 45,
        lastEdited: "Il y a 1 heure"
      }
    },
    "node-api": {
      id: "node-api",
      name: "Scalable API",
      description: "API REST scalable avec authentification avancée",
      type: "backend",
      color: "from-purple-700 to-indigo-700",
      gradient: "bg-gradient-to-br from-purple-700 via-indigo-600 to-purple-700",
      icon: Network,
      stack: ["Node.js", "Express", "MongoDB", "Redis", "JWT"],
      stats: {
        lines: 6789,
        files: 52,
        lastEdited: "Il y a 30 minutes"
      }
    }
  }

  const currentProject = projects[activeProject]
  const ProjectIcon = currentProject?.icon || Code2

  const handleRun = async () => {
    setIsRunning(true)
    setTerminalOutput(prev => [...prev, "> 🚀 Lancement du serveur de développement..."])
    await new Promise(resolve => setTimeout(resolve, 1500))
    setTerminalOutput(prev => [...prev, "> ✅ Serveur démarré sur http://localhost:3000"])
    setTerminalOutput(prev => [...prev, "> 📝 Prêt à coder !"])
    setIsRunning(false)
  }

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeployProgress(0)
    setTerminalOutput(prev => [...prev, "> ☁️ Préparation du déploiement..."])
    
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 500))
      setDeployProgress(i)
      if (i === 20) setTerminalOutput(prev => [...prev, "> 📦 Construction de l'application..."])
      if (i === 40) setTerminalOutput(prev => [...prev, "> 🔍 Exécution des tests..."])
      if (i === 60) setTerminalOutput(prev => [...prev, "> 🚀 Déploiement sur les serveurs..."])
      if (i === 80) setTerminalOutput(prev => [...prev, "> 🌐 Configuration du CDN..."])
      if (i === 100) setTerminalOutput(prev => [...prev, "> ✅ Déploiement réussi ! URL: https://nrb-talents.vercel.app"])
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

  if (!dict) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative w-20 h-20 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  const t = dict?.ide || {}

  return (
    <><div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      {/* Hero Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600 rounded-full blur-[128px] opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500 rounded-full blur-[150px] opacity-10"></div>

        {/* Animated grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=" />60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(168, 85, 247, 0.1)" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E')] opacity-30"></div>
    </div><div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with Purple Glow */}
        <div className="relative mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-2xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-purple-950/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
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
                  <p className="text-purple-300/70 mt-1">
                    {t.subtitle || "Environnement de développement dans le cloud"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 gap-2">
                  <Upload className="h-4 w-4" />
                  {t.import || "Importer"}
                </Button>
                <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 gap-2">
                  <Download className="h-4 w-4" />
                  {t.export || "Exporter"}
                </Button>
                <Button variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 gap-2">
                  <Share2 className="h-4 w-4" />
                  {t.share || "Partager"}
                </Button>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 gap-2">
                  <Cloud className="h-4 w-4" />
                  {t.deploy || "Déployer"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards with Purple Gradient */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Cpu, value: "2.4GHz", label: "CPU", color: "from-purple-500 to-purple-600" },
            { icon: Database, value: "8GB", label: "RAM", color: "from-pink-500 to-purple-600" },
            { icon: Zap, value: "500ms", label: "Latence", color: "from-purple-500 to-indigo-600" },
            { icon: Users, value: "3", label: "Collaborateurs", color: "from-fuchsia-500 to-purple-600" }
          ].map((stat, i) => (
            <Card key={i} className="relative overflow-hidden bg-purple-950/40 backdrop-blur-sm border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-20"></div>
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
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-purple-300"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {project.name}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {Object.entries(projects).map(([key, project]) => (
                <TabsContent key={key} value={key} className="space-y-6 mt-6">
                  {/* Project Header */}
                  <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${project.gradient} p-6`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <project.icon className="h-8 w-8 text-white" />
                        <h3 className="text-2xl font-bold text-white">{project.name}</h3>
                        <Badge className="bg-white/20 text-white border-0">
                          {project.type === "fullstack" && "Full Stack"}
                          {project.type === "frontend" && "Frontend"}
                          {project.type === "backend" && "Backend"}
                          {project.type === "ai" && "AI/ML"}
                        </Badge>
                      </div>
                      <p className="text-white/80 mb-4">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.stack.map((tech, i) => (
                          <Badge key={i} className="bg-white/20 text-white border-0">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-purple-900/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">{project.stats.lines.toLocaleString()}</div>
                      <div className="text-xs text-purple-300/70">{t.linesOfCode || "Lignes de code"}</div>
                    </div>
                    <div className="bg-purple-900/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">{project.stats.files}</div>
                      <div className="text-xs text-purple-300/70">{t.files || "Fichiers"}</div>
                    </div>
                    <div className="bg-purple-900/30 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">{t.lastEdit || "Dernière modif"}</div>
                      <div className="text-xs text-purple-300/70">{project.stats.lastEdited}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleRun}
                      disabled={isRunning}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25"
                    >
                      {isRunning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
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
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25"
                    >
                      {isDeploying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
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
                        <span>{deployProgress}%</span>
                      </div>
                      <Progress value={deployProgress} className="h-2 bg-purple-900/50" />
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* IDE Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* File Explorer Sidebar */}
          {showSidebar && (
            <Card className="lg:col-span-1 bg-purple-950/40 backdrop-blur-xl border-purple-500/30">
              <CardHeader className="pb-3">
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
              <CardContent className="space-y-1">
                {currentProject?.stack.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-500/20 cursor-pointer transition-colors group">
                    <FileCode className="h-3 w-3 text-purple-400" />
                    <span className="text-sm text-purple-300 group-hover:text-white">{file.toLowerCase().replace(/\s/g, '-')}.{file === "Next.js 14" ? "tsx" : file === "TypeScript" ? "ts" : file === "Tailwind CSS" ? "css" : file === "MongoDB" ? "db" : "js"}</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-purple-500/20">
                  <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-500/20 cursor-pointer">
                    <Plus className="h-3 w-3 text-purple-400" />
                    <span className="text-sm text-purple-300">{t.newFile || "Nouveau fichier"}</span>
                  </div>
                </div>
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
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm text-purple-300 ml-2">app/page.tsx</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize2 className="h-3 w-3 text-purple-400" /> : <Maximize2 className="h-3 w-3 text-purple-400" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Iframe Editor */}
              <iframe
                src="https://jam004-nrbtalents.hf.space"
                className="w-full h-[500px] border-0"
                style={{ background: '#1a1a2e' }} />
            </CardContent>
          </Card>

          {/* Right Sidebar */}
          <Card className="lg:col-span-1 bg-purple-950/40 backdrop-blur-xl border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-purple-400" />
                {t.terminal || "Terminal"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-black/50 rounded-lg p-3 font-mono text-xs space-y-1 h-48 overflow-y-auto">
                {terminalOutput.map((line, i) => (
                  <div key={i} className="text-purple-300/80">
                    {line}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-purple-500/50 text-purple-300 text-xs"
                  onClick={() => setTerminalOutput(prev => [...prev, "> " + new Date().toLocaleTimeString() + " - Command executed"])}
                >
                  <Terminal className="h-3 w-3 mr-1" />
                  {t.clear || "Effacer"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-purple-500/50 text-purple-300 text-xs"
                  onClick={() => setTerminalOutput([])}
                >
                  <X className="h-3 w-3 mr-1" />
                  {t.clearAll || "Tout effacer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 backdrop-blur-sm group hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Cloud className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{t.cloudNative || "Cloud Native"}</h3>
              <p className="text-sm text-purple-300/70">{t.cloudDesc || "Développez dans le cloud avec sauvegarde automatique"}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 backdrop-blur-sm group hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{t.collaboration || "Collaboration"}</h3>
              <p className="text-sm text-purple-300/70">{t.collabDesc || "Travaillez en équipe en temps réel"}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 backdrop-blur-sm group hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Rocket className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{t.instantDeploy || "Déploiement Instantané"}</h3>
              <p className="text-sm text-purple-300/70">{t.deployDesc || "Déployez en un clic sur nos infrastructures"}</p>
            </CardContent>
          </Card>
        </div>
      </div></>
  )
}