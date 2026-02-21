// components/ide/professional-vscode.tsx
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { 
  Play, 
  Square, 
  FolderOpen, 
  Save, 
  Download, 
  Upload,
  Settings,
  Maximize2,
  Minimize2,
  FileText,
  FileCode,
  Terminal,
  Search,
  Zap,
  Copy,
  CheckCircle2,
  GitBranch,
  Bug,
  Palette,
  Layout,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  FolderPlus,
  FilePlus,
  RefreshCw,
  Share2,
  Users,
  Cpu,
  Database,
  Network,
  Bell,
  Keyboard,
  Moon,
  Sun,
  Cloud
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Types professionnels
export interface FileStructure {
  id: string
  name: string
  type: 'file' | 'folder'
  language?: string
  content?: string
  children?: FileStructure[]
  isOpen?: boolean
  path?: string
}

export interface EditorState {
  activeFileId: string | null
  openFiles: string[]
  unsavedChanges: Set<string>
  layout: {
    sidebar: boolean
    terminal: boolean
    explorer: boolean
  }
  theme: 'dark' | 'light'
  fontSize: number
  wordWrap: boolean
}

export interface VSCodeEditorProps {
  project?: FileStructure
  onSave?: (files: FileStructure[]) => void
  onRun?: (code: string) => Promise<void>
  onDeploy?: (project: FileStructure) => Promise<void>
  height?: string
  defaultFiles?: FileStructure[]
  collaborative?: boolean
}

// Thèmes de syntaxe professionnels
const syntaxThemes = {
  dark: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    comment: '#6a9955',
    keyword: '#569cd6',
    string: '#ce9178',
    number: '#b5cea8',
    function: '#dcdcaa',
    variable: '#9cdcfe',
    type: '#4ec9b0',
    punctuation: '#d4d4d4'
  },
  light: {
    background: '#ffffff',
    foreground: '#333333',
    comment: '#008000',
    keyword: '#0000ff',
    string: '#a31515',
    number: '#098658',
    function: '#795e26',
    variable: '#001080',
    type: '#267f99',
    punctuation: '#333333'
  }
}

export function ProfessionalVSCode({ 
  project, 
  onSave, 
  onRun, 
  onDeploy,
  height = "600px",
  defaultFiles = [],
  collaborative = false
}: VSCodeEditorProps) {
  const router = useRouter()
  const [files, setFiles] = useState<FileStructure[]>([])
  const [editorState, setEditorState] = useState<EditorState>({
    activeFileId: null,
    openFiles: [],
    unsavedChanges: new Set(),
    layout: {
      sidebar: true,
      terminal: true,
      explorer: true
    },
    theme: 'dark',
    fontSize: 14,
    wordWrap: false
  })
  const [fileContent, setFileContent] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [terminalOutput, setTerminalOutput] = useState<string[]>([])
  const [commandInput, setCommandInput] = useState("")
  const [collaborators, setCollaborators] = useState<string[]>([])
  const [problems, setProblems] = useState<any[]>([])
  
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Projet de démonstration professionnel
  const professionalProject: FileStructure = {
    id: 'root',
    name: 'nrb-talents-app',
    type: 'folder',
    path: '/',
    children: [
      {
        id: 'src',
        name: 'src',
        type: 'folder',
        path: '/src',
        isOpen: true,
        children: [
          {
            id: 'app',
            name: 'app',
            type: 'folder',
            path: '/src/app',
            children: [
              {
                id: 'layout.tsx',
                name: 'layout.tsx',
                type: 'file',
                language: 'typescript',
                path: '/src/app/layout.tsx',
                content: `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NRB Talents - Plateforme Freelance',
  description: 'Trouvez vos meilleurs talents et projets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          {children}
        </div>
      </body>
    </html>
  )
}`
              },
              {
                id: 'page.tsx',
                name: 'page.tsx',
                type: 'file',
                language: 'typescript',
                path: '/src/app/page.tsx',
                content: `import { HeroSection } from '@/components/hero-section'
import { ProjectsGrid } from '@/components/projects-grid'
import { TalentMatching } from '@/components/talent-matching'

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ProjectsGrid />
      <TalentMatching />
    </main>
  )
}`
              }
            ]
          },
          {
            id: 'components',
            name: 'components',
            type: 'folder',
            path: '/src/components',
            children: [
              {
                id: 'hero-section.tsx',
                name: 'hero-section.tsx',
                type: 'file',
                language: 'typescript',
                path: '/src/components/hero-section.tsx',
                content: `'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl lg:text-6xl font-bold mb-6">
          Trouvez votre prochain
          <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
            projet freelance
          </span>
        </h1>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Rechercher React, Design, Marketing..."
              className="pl-12 pr-4 py-6 text-lg border-0 rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}`
              }
            ]
          },
          {
            id: 'lib',
            name: 'lib',
            type: 'folder',
            path: '/src/lib',
            children: [
              {
                id: 'utils.ts',
                name: 'utils.ts',
                type: 'file',
                language: 'typescript',
                path: '/src/lib/utils.ts',
                content: `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}`
              }
            ]
          }
        ]
      },
      {
        id: 'public',
        name: 'public',
        type: 'folder',
        path: '/public',
        children: [
          {
            id: 'favicon.ico',
            name: 'favicon.ico',
            type: 'file',
            path: '/public/favicon.ico'
          }
        ]
      },
      {
        id: 'package.json',
        name: 'package.json',
        type: 'file',
        language: 'json',
        path: '/package.json',
        content: `{
  "name": "nrb-talents-app",
  "version": "1.0.0",
  "description": "Plateforme freelance moderne",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@radix-ui/react-slot": "^1.0.0",
    "class-variance-authority": "^0.6.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.292.0"
  },
  "devDependencies": {
    "@types/node": "20.8.0",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "autoprefixer": "10.4.0",
    "eslint": "8.52.0",
    "eslint-config-next": "14.0.0",
    "postcss": "8.4.0",
    "prettier": "3.0.0",
    "tailwindcss": "3.3.0",
    "typescript": "5.2.0"
  }
}`
      },
      {
        id: 'tsconfig.json',
        name: 'tsconfig.json',
        type: 'file',
        language: 'json',
        path: '/tsconfig.json',
        content: `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`
      },
      {
        id: 'tailwind.config.js',
        name: 'tailwind.config.js',
        type: 'file',
        language: 'javascript',
        path: '/tailwind.config.js',
        content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`
      },
      {
        id: 'README.md',
        name: 'README.md',
        type: 'file',
        language: 'markdown',
        path: '/README.md',
        content: `# NRB Talents App

Une plateforme moderne pour connecter freelances et clients.

## Stack Technique

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: MongoDB avec Mongoose
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## Développement

\`\`\`bash
npm install
npm run dev
\`\`\`

## Déploiement

\`\`\`bash
npm run build
npm run start
\`\`\``
      }
    ]
  }

  // Initialisation
  useEffect(() => {
    setFiles(professionalProject.children || [])
    // Simuler des collaborateurs en temps réel
    if (collaborative) {
      setCollaborators(['john@nrb.com', 'sarah@nrb.com', 'mike@nrb.com'])
    }
  }, [])

  // Gestion des fichiers
  const findFileById = useCallback((id: string, items: FileStructure[] = files): FileStructure | null => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children) {
        const found = findFileById(id, item.children)
        if (found) return found
      }
    }
    return null
  }, [files])

  const handleFileSelect = (fileId: string) => {
    const file = findFileById(fileId)
    if (file && file.type === 'file') {
      setEditorState(prev => ({
        ...prev,
        activeFileId: fileId,
        openFiles: prev.openFiles.includes(fileId) ? prev.openFiles : [...prev.openFiles, fileId]
      }))
      setFileContent(file.content || "")
    }
  }

  const handleContentChange = useCallback((content: string) => {
    setFileContent(content)
    if (editorState.activeFileId) {
      setEditorState(prev => ({
        ...prev,
        unsavedChanges: new Set(prev.unsavedChanges).add(editorState.activeFileId!)
      }))
    }
  }, [editorState.activeFileId])

  // Sauvegarde automatique avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (editorState.unsavedChanges.size > 0 && onSave) {
        onSave(files)
        setEditorState(prev => ({
          ...prev,
          unsavedChanges: new Set()
        }))
        toast.success("Sauvegarde automatique effectuée")
      }
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [editorState.unsavedChanges, files, onSave])

  // Exécution de code
  const handleRun = async () => {
    if (!onRun) return
    
    setIsRunning(true)
    setTerminalOutput(prev => [...prev, "$ npm run dev", "Starting development server..."])

    try {
      await onRun(fileContent)
      setTerminalOutput(prev => [...prev, "✓ Server started on http://localhost:3000"])
      toast.success("Application démarrée avec succès")
    } catch (error) {
      setTerminalOutput(prev => [...prev, "✗ Failed to start server", error instanceof Error ? error.message : 'Unknown error'])
      toast.error("Erreur lors du démarrage")
    } finally {
      setIsRunning(false)
    }
  }

  const handleDeploy = async () => {
    if (!onDeploy) return
    
    setIsDeploying(true)
    setTerminalOutput(prev => [...prev, "$ npm run build", "Building application..."])

    try {
      await onDeploy(professionalProject)
      setTerminalOutput(prev => [...prev, "✓ Application deployed successfully"])
      toast.success("Déploiement réussi")
    } catch (error) {
      setTerminalOutput(prev => [...prev, "✗ Deployment failed", error instanceof Error ? error.message : 'Unknown error'])
      toast.error("Erreur lors du déploiement")
    } finally {
      setIsDeploying(false)
    }
  }

  // Gestion du terminal
  const handleTerminalCommand = (command: string) => {
    setTerminalOutput(prev => [...prev, `$ ${command}`])
    
    // Simulation de commandes
    switch (command.trim()) {
      case 'npm install':
        setTerminalOutput(prev => [...prev, "Installing dependencies...", "✓ All dependencies installed"])
        break
      case 'npm run build':
        setTerminalOutput(prev => [...prev, "Building application...", "✓ Build completed successfully"])
        break
      case 'git status':
        setTerminalOutput(prev => [...prev, "On branch main", "Your branch is up to date with 'origin/main'", "nothing to commit, working tree clean"])
        break
      default:
        setTerminalOutput(prev => [...prev, `Command not found: ${command}`])
    }
    
    setCommandInput("")
  }

  // Rendu de l'arborescence des fichiers
  const renderFileTree = (items: FileStructure[], level = 0) => {
    return items.map((item) => (
      <ContextMenu key={item.id}>
        <ContextMenuTrigger>
          <div className="select-none">
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-slate-700 rounded group",
                editorState.activeFileId === item.id && "bg-blue-600 text-white"
              )}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => handleFileSelect(item.id)}
            >
              {item.type === 'folder' ? (
                <FolderOpen className="h-4 w-4 text-blue-400" />
              ) : (
                <FileCode className="h-4 w-4 text-green-400" />
              )}
              <span className="flex-1 truncate">{item.name}</span>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {item.children && item.isOpen && renderFileTree(item.children, level + 1)}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem>
            <FilePlus className="h-4 w-4 mr-2" />
            Nouveau fichier
          </ContextMenuItem>
          <ContextMenuItem>
            <FolderPlus className="h-4 w-4 mr-2" />
            Nouveau dossier
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <Copy className="h-4 w-4 mr-2" />
            Copier le chemin
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ))
  }

  // Rendu avec coloration syntaxique basique
  const renderSyntaxHighlighted = (content: string) => {
    const theme = syntaxThemes[editorState.theme]
    return content.split('\n').map((line, index) => (
      <div key={index} className="flex">
        <span className="text-slate-500 w-8 text-right pr-2 select-none">{index + 1}</span>
        <span className="flex-1 font-mono" style={{ color: theme.foreground }}>
          {line}
        </span>
      </div>
    ))
  }

  const activeFile = editorState.activeFileId ? findFileById(editorState.activeFileId) : null

  return (
    <div className={cn(
      "bg-slate-900 text-white overflow-hidden rounded-lg border border-slate-700",
      isFullscreen && "fixed inset-0 z-50 rounded-none"
    )}>
      {/* Barre de titre */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-400" />
            <span className="font-semibold">VSCode - NRB Talents</span>
          </div>
          <Badge variant="secondary" className="bg-green-600 text-white">
            <GitBranch className="h-3 w-3 mr-1" />
            main
          </Badge>
          {collaborative && (
            <Badge variant="outline" className="bg-blue-600 text-white">
              <Users className="h-3 w-3 mr-1" />
              {collaborators.length} en ligne
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Bar Items */}
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>UTF-8</span>
            <span>TypeScript</span>
            <span>Ln 1, Col 1</span>
            <span>Espaces: 2</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditorState(prev => ({ 
              ...prev, 
              theme: prev.theme === 'dark' ? 'light' : 'dark' 
            }))}
            className="text-slate-300 hover:text-white"
          >
            {editorState.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-slate-300 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Barre d'activité */}
      <div className="flex bg-slate-800 border-b border-slate-700">
        <div className="flex">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-none border-b-2 px-4",
              editorState.layout.explorer ? "border-blue-500 text-white" : "border-transparent text-slate-400"
            )}
            onClick={() => setEditorState(prev => ({
              ...prev,
              layout: { ...prev.layout, explorer: !prev.layout.explorer }
            }))}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-none border-b-2 px-4",
              editorState.layout.terminal ? "border-green-500 text-white" : "border-transparent text-slate-400"
            )}
            onClick={() => setEditorState(prev => ({
              ...prev,
              layout: { ...prev.layout, terminal: !prev.layout.terminal }
            }))}
          >
            <Terminal className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none border-b-2 border-transparent text-slate-400 px-4"
          >
            <Bug className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none border-b-2 border-transparent text-slate-400 px-4"
          >
            <GitBranch className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Interface principale avec panneaux redimensionnables */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar */}
        {editorState.layout.explorer && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <div className="h-full bg-slate-800 border-r border-slate-700 flex flex-col">
                <div className="p-3 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      EXPLORATEUR
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <FolderPlus className="h-4 w-4 mr-2" />
                          Nouveau dossier
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FilePlus className="h-4 w-4 mr-2" />
                          Nouveau fichier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Actualiser
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger le projet
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {renderFileTree(files)}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}

        {/* Zone d'édition principale */}
        <ResizablePanel defaultSize={80}>
          <ResizablePanelGroup direction="vertical">
            {/* Éditeur */}
            <ResizablePanel defaultSize={70} minSize={30}>
              <div className="h-full flex flex-col">
                {/* Barre d'onglets des fichiers ouverts */}
                {editorState.openFiles.length > 0 && (
                  <div className="bg-slate-800 border-b border-slate-700 flex">
                    {editorState.openFiles.map(fileId => {
                      const file = findFileById(fileId)
                      if (!file) return null
                      
                      return (
                        <div
                          key={fileId}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm cursor-pointer border-r border-slate-700",
                            editorState.activeFileId === fileId 
                              ? "bg-slate-900 text-white" 
                              : "bg-slate-800 text-slate-400 hover:bg-slate-750"
                          )}
                          onClick={() => handleFileSelect(fileId)}
                        >
                          <FileCode className="h-4 w-4" />
                          <span>{file.name}</span>
                          {editorState.unsavedChanges.has(fileId) && (
                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-slate-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditorState(prev => ({
                                ...prev,
                                openFiles: prev.openFiles.filter(id => id !== fileId),
                                activeFileId: prev.activeFileId === fileId ? null : prev.activeFileId
                              }))
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Éditeur de code */}
                {activeFile ? (
                  <div className="flex-1 flex">
                    <ScrollArea className="flex-1">
                      <div className="p-4 font-mono text-sm leading-relaxed">
                        {renderSyntaxHighlighted(fileContent)}
                      </div>
                    </ScrollArea>
                    
                    {/* Mini-map (simplifiée) */}
                    <div className="w-20 bg-slate-800 border-l border-slate-700 hidden lg:block">
                      <div className="p-2 opacity-50 text-xs">
                        Mini-map
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <FileCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="mb-4">Ouvrez un fichier pour commencer à éditer</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-right text-slate-400">Ctrl+O</div>
                        <div className="text-left">Ouvrir un fichier</div>
                        <div className="text-right text-slate-400">Ctrl+N</div>
                        <div className="text-left">Nouveau fichier</div>
                        <div className="text-right text-slate-400">Ctrl+S</div>
                        <div className="text-left">Sauvegarder</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>

            {/* Terminal */}
            {editorState.layout.terminal && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <div className="h-full bg-black border-t border-slate-700 flex flex-col">
                    <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium">TERMINAL</span>
                        <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                          bash
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTerminalOutput([])}
                          className="text-slate-300 hover:text-white h-6 px-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <ScrollArea className="flex-1 p-4">
                      <div ref={terminalRef} className="font-mono text-sm text-green-400">
                        {terminalOutput.map((line, index) => (
                          <div key={index}>{line}</div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <div className="border-t border-slate-700 p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 text-sm">$</span>
                        <Input
                          value={commandInput}
                          onChange={(e) => setCommandInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleTerminalCommand(commandInput)
                            }
                          }}
                          className="flex-1 bg-transparent border-0 text-green-400 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="Tapez une commande..."
                        />
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Barre de statut */}
      <div className="bg-blue-600 px-4 py-1 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-3 w-3" />
            <span>{editorState.unsavedChanges.size} modifications non sauvegardées</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="h-3 w-3" />
            <span>TypeScript 5.2</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="h-6 px-2 text-white hover:bg-blue-700"
          >
            <Play className="h-3 w-3 mr-1" />
            {isRunning ? "En cours..." : "Exécuter"}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeploy}
            disabled={isDeploying}
            className="h-6 px-2 text-white hover:bg-blue-700"
          >
            <Cloud className="h-3 w-3 mr-1" />
            {isDeploying ? "Déploiement..." : "Déployer"}
          </Button>
          
          {collaborative && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-white hover:bg-blue-700"
            >
              <Share2 className="h-3 w-3 mr-1" />
              Partager
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfessionalVSCode