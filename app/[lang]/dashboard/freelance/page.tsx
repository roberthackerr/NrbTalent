// app/dashboard/freelance/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Eye, 
  Calendar,
  Zap,
  Star,
  Award,
  Users,
  MessageSquare,
  ArrowRight,
  Plus,
  Search,
  Rocket,
  Target,
  Brain,
  Sparkles,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Download,
  Upload,
  Shield,
  Crown,
  Coffee,
  Moon
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

// Types
interface DashboardStats {
  activeProjects: number
  pendingApplications: number
  completedProjects: number
  totalEarnings: number
  profileCompletion: number
  responseRate: number
  avgRating: number
  monthlyEarnings: number
  weeklyProductivity: number
  aiMatchScore: number
  skillGapIndex: number
  marketDemand: number
}

interface Project {
  id: string
  title: string
  client: {
    name: string
    avatar: string
    rating: number
  }
  budget: number
  deadline: string
  status: 'active' | 'pending' | 'completed' | 'overdue'
  progress: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  nextMilestone?: string
  timeSpent: number
  estimatedCompletion: string
}

interface AIRecommendation {
  id: string
  project: any
  matchScore: number
  matchGrade: 'excellent' | 'good' | 'potential' | 'low'
  reasoning: string[]
  urgency: 'high' | 'medium' | 'low'
  clientCompatibility: number
  earningsPotential: number
  skillDevelopment: number
}

interface ProductivitySession {
  id: string
  projectId: string
  projectTitle: string
  startTime: string
  endTime?: string
  duration: number
  focusScore: number
  tasksCompleted: string[]
}

interface MarketInsight {
  skill: string
  demand: number
  trend: 'up' | 'down' | 'stable'
  avgRate: number
  opportunity: 'high' | 'medium' | 'low'
  learningResources: string[]
}

// Safe array access utilities
const safeArray = <T,>(array: T[] | null | undefined): T[] => {
  return Array.isArray(array) ? array : []
}

const safeReduce = <T,>(
  array: T[] | null | undefined, 
  reducer: (acc: number, item: T) => number, 
  initialValue: number = 0
): number => {
  const safeArray = Array.isArray(array) ? array : []
  return safeArray.length > 0 ? safeArray.reduce(reducer, initialValue) : initialValue
}

const safeFilter = <T,>(
  array: T[] | null | undefined, 
  predicate: (item: T) => boolean
): T[] => {
  const safeArray = Array.isArray(array) ? array : []
  return safeArray.filter(predicate)
}

export default function RevolutionaryFreelanceDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    pendingApplications: 0,
    completedProjects: 0,
    totalEarnings: 0,
    profileCompletion: 75,
    responseRate: 85,
    avgRating: 4.8,
    monthlyEarnings: 0,
    weeklyProductivity: 0,
    aiMatchScore: 0,
    skillGapIndex: 0,
    marketDemand: 0
  })
  
  const [activeProjects, setActiveProjects] = useState<Project[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [productivitySessions, setProductivitySessions] = useState<ProductivitySession[]>([])
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [currentSession, setCurrentSession] = useState<ProductivitySession | null>(null)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // AI-Powered Data Analysis with safe array access
  const performanceMetrics = useMemo(() => {
    try {
      const safeRecommendations = safeArray(aiRecommendations)
      const safeInsights = safeArray(marketInsights)

      const totalMatchScore = safeReduce(safeRecommendations, (acc, rec) => acc + (rec.matchScore || 0), 0)
      const avgMatchScore = safeRecommendations.length > 0 ? totalMatchScore / safeRecommendations.length : 0
      
      const highValueProjects = safeFilter(safeRecommendations, rec => (rec.earningsPotential || 0) > 80).length
      const skillGapAreas = safeFilter(safeInsights, insight => insight.opportunity === 'high').length
      
      return {
        aiIntelligence: Math.round(avgMatchScore) || 0,
        highValueOpportunities: highValueProjects || 0,
        skillGaps: skillGapAreas || 0,
        productivityScore: Math.round(stats.weeklyProductivity) || 0,
        marketPosition: Math.round(((stats.aiMatchScore || 0) + (stats.marketDemand || 0)) / 2) || 0
      }
    } catch (error) {
      console.error('Error calculating performance metrics:', error)
      return {
        aiIntelligence: 0,
        highValueOpportunities: 0,
        skillGaps: 0,
        productivityScore: 0,
        marketPosition: 0
      }
    }
  }, [aiRecommendations, marketInsights, stats])

  useEffect(() => {
    fetchDashboardData()
    const cleanup = startBackgroundSync()
    return cleanup
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setErrors({})
      
      // Fetch comprehensive stats with error handling for each request
      const endpoints = [
        { key: 'stats', url: '/api/users/stats?extended=true' },
        { key: 'projects', url: '/api/projects?status=active&detailed=true' },
        { key: 'recommendations', url: '/api/ai/freelancer-recommendations?limit=10&enhanced=true' },
        { key: 'insights', url: '/api/market/insights?skills=all' },
        { key: 'sessions', url: '/api/productivity/sessions?period=week' }
      ]

      const results = await Promise.allSettled(
        endpoints.map(endpoint => fetch(endpoint.url).then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
          return res.json()
        }))
      )

      // Process results with error handling
      results.forEach((result, index) => {
        const endpoint = endpoints[index]
        if (result.status === 'fulfilled') {
          switch (endpoint.key) {
            case 'stats':
              setStats(prev => ({ ...prev, ...result.value }))
              break
            case 'projects':
              setActiveProjects(Array.isArray(result.value?.projects) ? result.value.projects : [])
              break
            case 'recommendations':
              // Handle different response formats
              const recsData = result.value
              if (Array.isArray(recsData)) {
                setAiRecommendations(recsData)
              } else if (recsData?.recommendations) {
                setAiRecommendations(recsData.recommendations)
              } else if (recsData?.matches) {
                setAiRecommendations(recsData.matches)
              } else {
                setAiRecommendations([])
              }
              break
            case 'insights':
              setMarketInsights(Array.isArray(result.value) ? result.value : [])
              break
            case 'sessions':
              setProductivitySessions(Array.isArray(result.value) ? result.value : [])
              break
          }
        } else {
          console.error(`Failed to fetch ${endpoint.key}:`, result.reason)
          setErrors(prev => ({
            ...prev,
            [endpoint.key]: `Failed to load ${endpoint.key}`
          }))
        }
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setErrors(prev => ({
        ...prev,
        general: 'Failed to load dashboard data'
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const startBackgroundSync = () => {
    // Real-time data synchronization with error handling
    const syncInterval = setInterval(() => {
      fetchDashboardData().catch(error => {
        console.error('Background sync failed:', error)
      })
    }, 30000) // Sync every 30 seconds
    
    return () => clearInterval(syncInterval)
  }

  const startWorkSession = async (projectId: string) => {
    try {
      const session: ProductivitySession = {
        id: Date.now().toString(),
        projectId,
        projectTitle: activeProjects.find(p => p.id === projectId)?.title || 'Unknown Project',
        startTime: new Date().toISOString(),
        duration: 0,
        focusScore: 85,
        tasksCompleted: []
      }
      setCurrentSession(session)
      
      // Start time tracking
      await fetch('/api/time-entries/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId })
      })
    } catch (error) {
      console.error('Error starting work session:', error)
    }
  }

  const stopWorkSession = async () => {
    if (!currentSession) return
    
    try {
      await fetch('/api/time-entries/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: currentSession.id })
      })
      setCurrentSession(null)
      fetchDashboardData() // Refresh data
    } catch (error) {
      console.error('Error stopping work session:', error)
    }
  }

  const quickApply = async (projectId: string) => {
    try {
      // AI-powered quick application
      await fetch('/api/ai/quick-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          projectId,
          useAITemplate: true,
          personalize: true 
        })
      })
    } catch (error) {
      console.error('Error with quick apply:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <DashboardSidebar role="freelance" />
        <div className="flex-1 p-8">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <DashboardSidebar role="freelance" />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Some data failed to load</span>
              </div>
              <ul className="mt-2 text-sm text-red-700">
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>• {message}</li>
                ))}
              </ul>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={fetchDashboardData}
              >
                Retry Loading Data
              </Button>
            </div>
          )}

          {/* AI-Powered Header with Personal Assistant */}
          <AIPersonalAssistant 
            stats={stats}
            recommendations={aiRecommendations}
            currentSession={currentSession}
          />

          {/* Revolutionary Stats Grid */}
          <RevolutionaryStats 
            stats={stats}
            performance={performanceMetrics}
            currentSession={currentSession}
          />

          {/* Smart Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Overview
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Smart Projects
              </TabsTrigger>
              <TabsTrigger value="opportunities" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AI Opportunities
              </TabsTrigger>
              <TabsTrigger value="productivity" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Deep Focus
              </TabsTrigger>
              <TabsTrigger value="market" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Market Intel
              </TabsTrigger>
            </TabsList>

            {/* AI Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <AIDashboard 
                  recommendations={aiRecommendations}
                  marketInsights={marketInsights}
                  stats={stats}
                />
                <ProductivityAnalytics 
                  sessions={productivitySessions}
                  currentSession={currentSession}
                  onStartSession={startWorkSession}
                  onStopSession={stopWorkSession}
                  projects={activeProjects}
                />
              </div>
            </TabsContent>

            {/* Smart Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <SmartProjectManagement 
                projects={activeProjects}
                currentSession={currentSession}
                onStartSession={startWorkSession}
                onStopSession={stopWorkSession}
              />
            </TabsContent>

            {/* AI Opportunities Tab */}
            <TabsContent value="opportunities" className="space-y-6">
              <AIOpportunityEngine 
                recommendations={aiRecommendations}
                onQuickApply={quickApply}
                stats={stats}
              />
            </TabsContent>

            {/* Deep Focus Tab */}
            <TabsContent value="productivity" className="space-y-6">
              <DeepFocusWorkspace 
                sessions={productivitySessions}
                currentSession={currentSession}
                projects={activeProjects}
                onStartSession={startWorkSession}
                onStopSession={stopWorkSession}
              />
            </TabsContent>

            {/* Market Intel Tab */}
            <TabsContent value="market" className="space-y-6">
              <MarketIntelligence 
                insights={marketInsights}
                stats={stats}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Safe component implementations
function AIPersonalAssistant({ stats, recommendations, currentSession }: any) {
  const safeRecommendations = safeArray(recommendations)
  
  const getAIMessage = () => {
    if (currentSession) {
      return "🚀 You're in the zone! Keep up the great work."
    }
    if (safeRecommendations.length > 0) {
      const excellentMatches = safeFilter(safeRecommendations, (r: any) => r.matchGrade === 'excellent')
      if (excellentMatches.length > 0) {
        return `🎯 ${excellentMatches.length} perfect matches found! Apply now for high success rate.`
      }
    }
    if (stats.profileCompletion < 90) {
      return "📈 Complete your profile to unlock 40% more opportunities"
    }
    return "🤖 Ready to find your next perfect project? Let's optimize your workflow."
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Brain className="h-6 w-6" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Work Assistant</h1>
            <p className="text-blue-100">{getAIMessage()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-white/20 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Coffee className="h-4 w-4 mr-2" />
              Focus Mode
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Moon className="h-4 w-4 mr-2" />
              Deep Work
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RevolutionaryStats({ stats, performance, currentSession }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {/* Earnings Intelligence */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Smart Earnings</p>
              <p className="text-2xl font-bold">${(stats.totalEarnings || 0).toLocaleString()}</p>
              <p className="text-xs text-green-600">+12% this month</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          {currentSession && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="default" className="bg-orange-100 text-orange-700">
                <Play className="h-3 w-3 mr-1" />
                Working
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Match Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AI Match Score</p>
              <p className="text-2xl font-bold">{performance.aiIntelligence}%</p>
              <p className="text-xs text-blue-600">Market Position</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Productivity Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Focus Score</p>
              <p className="text-2xl font-bold">{performance.productivityScore}%</p>
              <p className="text-xs text-purple-600">This Week</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High-Value Opportunities */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Premium Matches</p>
              <p className="text-2xl font-bold">{performance.highValueOpportunities}</p>
              <p className="text-xs text-green-600">High-Earning</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Crown className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Gap Index */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Growth Areas</p>
              <p className="text-2xl font-bold">{performance.skillGaps}</p>
              <p className="text-xs text-orange-600">Learn & Earn</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Demand */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Market Heat</p>
              <p className="text-2xl font-bold">{performance.marketPosition}%</p>
              <p className="text-xs text-red-600">High Demand</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AIDashboard({ recommendations, marketInsights, stats }: any) {
  const safeRecommendations = safeArray(recommendations)
  const safeInsights = safeArray(marketInsights)
  
  const excellentMatches = safeFilter(safeRecommendations, (r: any) => r.matchGrade === 'excellent')
  const urgentSkills = safeFilter(safeInsights, (i: any) => i.opportunity === 'high')

  return (
    <div className="space-y-6">
      {/* AI Match Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Match Intelligence
          </CardTitle>
          <CardDescription>
            Personalized project recommendations powered by advanced AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {excellentMatches.slice(0, 3).map((rec: any) => (
              <div key={rec.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    rec.matchGrade === 'excellent' ? 'bg-green-500' :
                    rec.matchGrade === 'good' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-semibold text-sm">{rec.project?.title || 'Unknown Project'}</p>
                    <p className="text-xs text-gray-500">{rec.reasoning?.[0] || 'High compatibility match'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={
                    rec.matchGrade === 'excellent' ? 'bg-green-100 text-green-800' :
                    rec.matchGrade === 'good' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }>
                    {(rec.matchScore || 0)}%
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    ${rec.project?.budget?.max?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            ))}
            {excellentMatches.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No excellent matches found yet</p>
                <p className="text-sm">Complete your profile for better recommendations</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skill Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Skill Growth Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {urgentSkills.slice(0, 4).map((insight: any, index: number) => (
              <div key={insight.skill} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{insight.skill}</p>
                    <p className="text-xs text-gray-500">${insight.avgRate}/hr • {insight.demand}% demand</p>
                  </div>
                </div>
                <Badge variant={
                  insight.trend === 'up' ? 'default' :
                  insight.trend === 'down' ? 'destructive' : 'secondary'
                }>
                  {insight.trend === 'up' ? '🔥 Hot' : insight.trend === 'down' ? '📉 Falling' : '📊 Stable'}
                </Badge>
              </div>
            ))}
            {urgentSkills.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>No skill insights available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProductivityAnalytics({ sessions, currentSession, onStartSession, onStopSession, projects }: any) {
  const safeSessions = safeArray(sessions)
  const safeProjects = safeArray(projects)
  
  const todaySessions = safeFilter(safeSessions, (s: any) => 
    new Date(s.startTime).toDateString() === new Date().toDateString()
  )

  return (
    <div className="space-y-6">
      {/* Deep Focus Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Deep Focus Timer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentSession ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {Math.floor((Date.now() - new Date(currentSession.startTime).getTime()) / 60000)}m
                </div>
                <p className="text-green-700 font-medium">In Deep Work</p>
                <p className="text-sm text-green-600">{currentSession.projectTitle}</p>
              </div>
              <Button onClick={() => onStopSession()} className="w-full" variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Start a focused work session</p>
              <div className="grid grid-cols-2 gap-2">
                {safeProjects.slice(0, 4).map((project: any) => (
                  <Button
                    key={project.id}
                    variant="outline"
                    className="h-12"
                    onClick={() => onStartSession(project.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {project.title?.slice(0, 15) || 'Project'}...
                  </Button>
                ))}
                {safeProjects.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    <p>No active projects</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Productivity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todaySessions.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{session.projectTitle}</p>
                  <p className="text-xs text-gray-500">{session.duration} min • {session.focusScore}% focus</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{session.tasksCompleted?.length || 0} tasks</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
            ))}
            {todaySessions.length === 0 && (
              <p className="text-center text-gray-500 py-4">No sessions today</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Placeholder components for other tabs (implement similarly with safe array access)
function SmartProjectManagement({ projects, currentSession, onStartSession, onStopSession }: any) {
  const safeProjects = safeArray(projects)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Project Management</CardTitle>
        <CardDescription>AI-optimized project tracking and workflow</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {safeProjects.map((project: any) => (
            <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">{project.title}</p>
                <p className="text-sm text-gray-500">Progress: {project.progress}%</p>
              </div>
              <Button
                onClick={() => currentSession ? onStopSession() : onStartSession(project.id)}
                variant={currentSession?.projectId === project.id ? "destructive" : "default"}
              >
                {currentSession?.projectId === project.id ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Working
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Working
                  </>
                )}
              </Button>
            </div>
          ))}
          {safeProjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No active projects</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AIOpportunityEngine({ recommendations, onQuickApply, stats }: any) {
  const safeRecommendations = safeArray(recommendations)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Opportunity Engine</CardTitle>
        <CardDescription>High-value projects matched to your skills</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {safeRecommendations.slice(0, 5).map((rec: any) => (
            <div key={rec.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{rec.project?.title || 'Project'}</h3>
                  <p className="text-sm text-gray-600">{rec.reasoning?.[0]}</p>
                </div>
                <Badge className={
                  rec.matchGrade === 'excellent' ? 'bg-green-100 text-green-800' :
                  rec.matchGrade === 'good' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                }>
                  {rec.matchScore}% Match
                </Badge>
              </div>
              <Button 
                onClick={() => rec.project?.id && onQuickApply(rec.project.id)}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                AI Quick Apply
              </Button>
            </div>
          ))}
          {safeRecommendations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Zap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No recommendations available</p>
              <p className="text-sm">Complete your profile for personalized matches</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DeepFocusWorkspace({ sessions, currentSession, projects, onStartSession, onStopSession }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deep Focus Workspace</CardTitle>
        <CardDescription>Optimize your concentration and productivity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p>Deep Focus Analytics Coming Soon</p>
        </div>
      </CardContent>
    </Card>
  )
}

function MarketIntelligence({ insights, stats }: any) {
  const safeInsights = safeArray(insights)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Intelligence</CardTitle>
        <CardDescription>Real-time market trends and opportunities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {safeInsights.slice(0, 5).map((insight: any, index: number) => (
            <div key={insight.skill} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-blue-600">{index + 1}</span>
                </div>
                <div>
                  <p className="font-semibold">{insight.skill}</p>
                  <p className="text-sm text-gray-500">
                    ${insight.avgRate}/hr • {insight.demand}% demand
                  </p>
                </div>
              </div>
              <Badge variant={
                insight.trend === 'up' ? 'default' :
                insight.trend === 'down' ? 'destructive' : 'secondary'
              }>
                {insight.trend === 'up' ? '📈 Rising' : insight.trend === 'down' ? '📉 Falling' : '➡️ Stable'}
              </Badge>
            </div>
          ))}
          {safeInsights.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No market insights available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-2xl mb-6"></div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
