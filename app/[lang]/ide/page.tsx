// app/ide/page.tsx
"use client"

import { useState } from "react"
import ProfessionalVSCode from "@/components/ide/professional-vscode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
  Database
} from "lucide-react"

export default function ProfessionalIDEPage() {
  const [activeProject, setActiveProject] = useState("nrb-talents")

  const projects = {
    "nrb-talents": {
      name: "NRB Talents Platform",
      description: "Plateforme complète de mise en relation freelances/clients",
      type: "fullstack",
      stack: ["Next.js 14", "TypeScript", "Tailwind CSS", "MongoDB"]
    },
    "react-dashboard": {
      name: "React Admin Dashboard",
      description: "Tableau de bord administratif avec React et Chart.js",
      type: "frontend",
      stack: ["React 18", "TypeScript", "Chart.js", "shadcn/ui"]
    },
    "node-api": {
      name: "REST API Node.js",
      description: "API REST complète avec authentification JWT",
      type: "backend", 
      stack: ["Node.js", "Express", "MongoDB", "JWT"]
    }
  }

  const handleSave = (files: any[]) => {
    console.log("Fichiers sauvegardés professionnellement:", files)
  }

  const handleRun = async (code: string) => {
    // Simulation d'exécution professionnelle
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log("Code exécuté:", code)
  }

  const handleDeploy = async (project: any) => {
    // Simulation de déploiement professionnel
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log("Projet déployé:", project)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête professionnel */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  IDE Professionnel
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Environnement de développement complet dans le cloud
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Importer Project
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter ZIP
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Collaboration
            </Button>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Cloud className="h-4 w-4" />
              Déployer
            </Button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">2.4GHz</div>
                  <div className="text-sm text-slate-600">CPU</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">8GB</div>
                  <div className="text-sm text-slate-600">RAM</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">500ms</div>
                  <div className="text-sm text-slate-600">Latence</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">3</div>
                  <div className="text-sm text-slate-600">Collaborateurs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sélecteur de projet professionnel */}
        <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-blue-500" />
              Projets Professionnels
            </CardTitle>
            <CardDescription>
              Choisissez parmi nos templates professionnels ou démarrez from scratch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeProject} onValueChange={setActiveProject}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-100/50">
                <TabsTrigger value="nrb-talents" className="flex items-center gap-2 data-[state=active]:bg-white">
                  <Zap className="h-4 w-4" />
                  NRB Talents
                  <Badge variant="secondary" className="ml-2 bg-green-500 text-white">Recommandé</Badge>
                </TabsTrigger>
                <TabsTrigger value="react-dashboard" className="flex items-center gap-2 data-[state=active]:bg-white">
                  <Play className="h-4 w-4" />
                  React Dashboard
                </TabsTrigger>
                <TabsTrigger value="node-api" className="flex items-center gap-2 data-[state=active]:bg-white">
                  <Square className="h-4 w-4" />
                  Node.js API
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="nrb-talents" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-500" />
                        Frontend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Next.js 14</Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">TypeScript</Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Tailwind CSS</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Database className="h-4 w-4 text-green-500" />
                        Backend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">Node.js</Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700">MongoDB</Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700">NextAuth</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Cloud className="h-4 w-4 text-purple-500" />
                        Deployment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">Vercel</Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">MongoDB Atlas</Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">GitHub Actions</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Settings className="h-4 w-4 text-orange-500" />
                        Tools
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">ESLint</Badge>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">Prettier</Badge>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">Jest</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Éditeur VSCode Professionnel */}
        <ProfessionalVSCode
          onSave={handleSave}
          onRun={handleRun}
          onDeploy={handleDeploy}
          height="70vh"
          collaborative={true}
        />

        {/* Informations professionnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Cloud className="h-5 w-5" />
                Cloud Native
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">
                Développez directement dans le cloud avec sauvegarde automatique et accès depuis n'importe où.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Users className="h-5 w-5" />
                Collaboration Temps Réel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700">
                Travaillez en équipe avec l'édition collaborative, le partage d'écran et le chat intégré.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Zap className="h-5 w-5" />
                Déploiement Instantané
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-700">
                Déployez votre application en un clic sur nos infrastructures haute performance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}