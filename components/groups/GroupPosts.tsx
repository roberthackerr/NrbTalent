'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  MessageSquare, Heart, HeartOff, Share2, Bookmark, MoreVertical, 
  Calendar, Briefcase, Users, Image as ImageIcon, FileText, Eye, 
  Download, ExternalLink, ChevronLeft, ChevronRight, X,
  ThumbsUp, Smile, Lightbulb, HelpCircle, PartyPopper, 
  Send, BookmarkCheck, Globe, Lock, Users as UsersIcon, Video,
  Music, MapPin, Link, Edit, Trash2, Flag, Copy, Check,
  MoreHorizontal, Zap, TrendingUp, Award, Star,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import Image from 'next/image'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// Types
interface PostAuthor {
  _id: string
  name: string
  avatar?: string
  title?: string
  company?: string
  isOnline?: boolean
  isVerified?: boolean
  followers?: number
}

interface PostAttachment {
  url: string
  name: string
  size: number
  type: string
  thumbnail?: string
}

interface Post {
  _id: string
  title: string
  content: string
  type: 'discussion' | 'question' | 'event' | 'job' | 'announcement' | 'poll'
  images?: string[]
  videos?: string[]
  attachments?: PostAttachment[]
  author: PostAuthor
  authorRole?: 'owner' | 'admin' | 'moderator' | 'member'
  createdAt: string
  updatedAt?: string
  reactionCounts: {
    like: number
    love: number
    insightful: number
    helpful: number
    celebrate: number
  }
  userReactions?: {
    [key: string]: string[] // userId -> reaction type
  }
  commentCount: number
  viewCount: number
  shareCount: number
  saveCount: number
  tags: string[]
  isPinned?: boolean
  isFeatured?: boolean
  isSponsored?: boolean
  status: 'published' | 'draft' | 'archived'
  pollData?: {
    question: string
    options: {
      id: string
      text: string
      votes: number
      percentage: number
      voted: boolean
    }[]
    totalVotes: number
    endsAt?: string
    multipleChoice: boolean
    voted?: boolean
  }
  eventData?: {
    startDate: string
    endDate?: string
    location: string
    venue?: string
    isOnline: boolean
    attendees: number
    maxAttendees?: number
  }
  jobData?: {
    company: string
    location: string
    salary: string
    type: 'full-time' | 'part-time' | 'contract' | 'internship'
    experience: string
    remote: boolean
    applyLink: string
  }
  metrics?: {
    engagementRate: number
    reach: number
    impressions: number
  }
}

interface Comment {
  _id: string
  content: string
  author: PostAuthor
  createdAt: string
  likes: number
  replies: Comment[]
  userLiked: boolean
}

interface GroupPostsProps {
  groupId: string
  isMember: boolean
  userRole?: 'owner' | 'admin' | 'moderator' | 'member'
}

type ReactionType = 'like' | 'love' | 'insightful' | 'helpful' | 'celebrate'

// Constantes
const REACTION_EMOJIS = {
  like: '👍',
  love: '❤️',
  insightful: '💡',
  helpful: '🤝',
  celebrate: '🎉'
}

const REACTION_ICONS = {
  like: ThumbsUp,
  love: Smile,
  insightful: Lightbulb,
  helpful: HelpCircle,
  celebrate: PartyPopper
}

const REACTION_COLORS = {
  like: 'text-blue-600',
  love: 'text-red-500',
  insightful: 'text-yellow-600',
  helpful: 'text-green-600',
  celebrate: 'text-purple-600'
}

// Composant pour la barre de réactions flottante (comme Facebook)
function ReactionSelector({ 
  onSelect, 
  onMouseEnter, 
  onMouseLeave 
}: { 
  onSelect: (reaction: ReactionType) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  const reactions: { type: ReactionType; emoji: string; label: string }[] = [
    { type: 'like', emoji: '👍', label: 'J\'aime' },
    { type: 'love', emoji: '❤️', label: 'J\'adore' },
    { type: 'insightful', emoji: '💡', label: 'Intéressant' },
    { type: 'helpful', emoji: '🤝', label: 'Utile' },
    { type: 'celebrate', emoji: '🎉', label: 'Célébrer' }
  ]

  return (
    <div 
      className="absolute -top-12 left-0 bg-white shadow-xl rounded-full p-2 flex items-center gap-1 border border-gray-200"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {reactions.map((reaction) => (
        <TooltipProvider key={reaction.type}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelect(reaction.type)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 transition-transform duration-200"
              >
                {reaction.emoji}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{reaction.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}

// Composant pour les métriques avancées
function PostMetrics({ metrics }: { metrics?: Post['metrics'] }) {
  if (!metrics) return null

  return (
    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">Statistiques avancées</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-700">{metrics.engagementRate}%</div>
          <div className="text-xs text-blue-600">Engagement</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-700">{metrics.reach.toLocaleString()}</div>
          <div className="text-xs text-purple-600">Portée</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-700">{metrics.impressions.toLocaleString()}</div>
          <div className="text-xs text-green-600">Impressions</div>
        </div>
      </div>
    </div>
  )
}

// Composant pour les sondages
function PollDisplay({ pollData, postId, groupId, isMember }: { 
  pollData: NonNullable<Post['pollData']>
  postId: string
  groupId: string
  isMember: boolean
}) {
  const [voted, setVoted] = useState(pollData.voted || false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const handleVote = async () => {
    if (!isMember || selectedOptions.length === 0) return

    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: selectedOptions })
      })

      if (response.ok) {
        setVoted(true)
        toast.success('Vote enregistré !')
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Erreur lors du vote')
    }
  }

  const handleOptionSelect = (optionId: string) => {
    if (voted) return

    if (pollData.multipleChoice) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-5 w-5 text-purple-600" />
        <h4 className="font-semibold text-gray-800">Sondage</h4>
      </div>
      
      <p className="text-sm text-gray-700 mb-4">{pollData.question}</p>
      
      <div className="space-y-3 mb-4">
        {pollData.options.map((option) => (
          <div key={option.id} className="relative">
            <button
              onClick={() => !voted && handleOptionSelect(option.id)}
              disabled={voted}
              className={`w-full p-3 text-left rounded-lg border transition-all duration-200 ${
                selectedOptions.includes(option.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${voted ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`${selectedOptions.includes(option.id) ? 'font-medium' : ''}`}>
                  {option.text}
                </span>
                {voted && (
                  <span className="text-sm font-semibold text-gray-600">{option.percentage}%</span>
                )}
              </div>
              
              {voted && (
                <div className="mt-2">
                  <Progress 
                    value={option.percentage} 
                    className="h-2"
                  />
                </div>
              )}
            </button>
            
            {selectedOptions.includes(option.id) && !voted && (
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                <Check className="h-3 w-3" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {!voted ? (
        <Button
          onClick={handleVote}
          disabled={selectedOptions.length === 0}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          Voter ({selectedOptions.length} sélectionné{selectedOptions.length > 1 ? 's' : ''})
        </Button>
      ) : (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Vous avez voté • {pollData.totalVotes} votes</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant pour les événements
function EventDisplay({ eventData }: { eventData: NonNullable<Post['eventData']> }) {
  const isUpcoming = new Date(eventData.startDate) > new Date()
  const isOnline = eventData.isOnline

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-5 w-5 text-green-600" />
        <h4 className="font-semibold text-green-800">Événement</h4>
        {isUpcoming && (
          <Badge className="bg-green-100 text-green-800">À venir</Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">
              {new Date(eventData.startDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            {isOnline ? (
              <>
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Événement en ligne</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-sm">{eventData.location}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-white p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Participants</span>
            </div>
            <span className="font-bold text-green-700">
              {eventData.attendees}
              {eventData.maxAttendees && `/${eventData.maxAttendees}`}
            </span>
          </div>
          {eventData.maxAttendees && (
            <Progress 
              value={(eventData.attendees / eventData.maxAttendees) * 100} 
              className="h-2"
            />
          )}
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <Button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600">
          <Calendar className="h-4 w-4 mr-2" />
          {isUpcoming ? "S'inscrire" : "Revoir l'événement"}
        </Button>
        <Button variant="outline" className="flex-1">
          <Share2 className="h-4 w-4 mr-2" />
          Partager
        </Button>
      </div>
    </div>
  )
}

// Composant pour les offres d'emploi
function JobDisplay({ jobData }: { jobData: NonNullable<Post['jobData']> }) {
  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase className="h-5 w-5 text-blue-600" />
        <h4 className="font-semibold text-blue-800">Offre d'emploi</h4>
        <Badge className="ml-auto bg-blue-100 text-blue-800">
          {jobData.type === 'full-time' ? 'CDI' : 
           jobData.type === 'part-time' ? 'Temps partiel' :
           jobData.type === 'contract' ? 'Contrat' : 'Stage'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border">
              <Briefcase className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Entreprise</div>
              <div className="font-medium">{jobData.company}</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border">
              <MapPin className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Localisation</div>
              <div className="font-medium">
                {jobData.location}
                {jobData.remote && ' (Remote)'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border">
              <Zap className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Expérience</div>
              <div className="font-medium">{jobData.experience}</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center border">
              <Award className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Salaire</div>
              <div className="font-medium">{jobData.salary}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button asChild className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700">
          <a href={jobData.applyLink} target="_blank" rel="noopener noreferrer">
            Postuler maintenant
          </a>
        </Button>
        <Button variant="outline" className="flex-1">
          <Bookmark className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
      </div>
    </div>
  )
}

// Composant pour les commentaires (inspiré d'Instagram)
function CommentsSection({ 
  postId, 
  groupId, 
  initialComments = [] 
}: { 
  postId: string
  groupId: string
  initialComments: Comment[]
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newComment,
          parentId: replyingTo 
        })
      })

      if (response.ok) {
        const newCommentData = await response.json()
        if (replyingTo) {
          setComments(prev => prev.map(comment => 
            comment._id === replyingTo 
              ? { ...comment, replies: [...comment.replies, newCommentData] }
              : comment
          ))
        } else {
          setComments(prev => [newCommentData, ...prev])
        }
        setNewComment('')
        setReplyingTo(null)
        toast.success('Commentaire publié')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Erreur lors de la publication')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-4 border-t pt-4">
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {comments.map((comment) => (
          <div key={comment._id} className="group">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author.avatar} />
                <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.author.name}</span>
                    {comment.author.isVerified && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
                <div className="flex items-center gap-4 mt-2 px-2">
                  <button className="text-xs text-gray-500 hover:text-gray-700">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
                  </button>
                  <button 
                    onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Répondre
                  </button>
                  <button className="text-xs text-gray-500 hover:text-gray-700">
                    {comment.likes} j'aime
                  </button>
                </div>
                
                {replyingTo === comment._id && (
                  <div className="ml-8 mt-2">
                    <div className="flex gap-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Écrivez votre réponse..."
                        className="min-h-[60px] flex-1"
                      />
                      <Button 
                        onClick={handleSubmitComment} 
                        disabled={isLoading}
                        size="icon"
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {comment.replies.length > 0 && (
                  <div className="ml-8 mt-2 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="flex gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={reply.author.avatar} />
                          <AvatarFallback>{reply.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-2xl rounded-tl-none px-3 py-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-xs">{reply.author.name}</span>
                            </div>
                            <p className="text-xs text-gray-700">{reply.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className="min-h-[60px] flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmitComment()
            }
          }}
        />
        <Button 
          onClick={handleSubmitComment} 
          disabled={isLoading || !newComment.trim()}
          className="self-end"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

// Composant principal GroupPosts amélioré
export function GroupPosts({ groupId, isMember, userRole }: GroupPostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [reactingPosts, setReactingPosts] = useState<Set<string>>(new Set())
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set())
  const [selectedPostForComments, setSelectedPostForComments] = useState<string | null>(null)
  const [showReactionSelector, setShowReactionSelector] = useState<string | null>(null)
  const [reactionTimeout, setReactionTimeout] = useState<NodeJS.Timeout | null>(null)
  const [currentUserReactions, setCurrentUserReactions] = useState<Record<string, ReactionType>>({})
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'pinned' | 'events' | 'jobs'>('all')

  // Carousel ref
  const carouselRefs = useRef<Record<string, any>>({})

  const fetchPosts = useCallback(async (tab = activeTab) => {
    if (!groupId) return
    
    setLoading(true)
    try {
      let url = `/api/groups/${groupId}/posts?page=${page}&limit=10`
      
      switch (tab) {
        case 'featured':
          url += '&featured=true'
          break
        case 'pinned':
          url += '&pinned=true'
          break
        case 'events':
          url += '&type=event'
          break
        case 'jobs':
          url += '&type=job'
          break
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des posts')
      }
      
      const data = await response.json()
      
      if (page === 1) {
        setPosts(data.posts || [])
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])])
      }
      
      setHasMore(data.pagination?.page < data.pagination?.pages)
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Erreur lors du chargement des posts')
    } finally {
      setLoading(false)
    }
  }, [groupId, page, activeTab])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts, activeTab])

  const handleReaction = async (postId: string, reaction: ReactionType) => {
    if (reactingPosts.has(postId) || !isMember) return
    
    setReactingPosts(prev => new Set(prev).add(postId))
    
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Mettre à jour l'état local
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            const currentCount = post.reactionCounts[reaction] || 0
            
            if (data.action === 'removed') {
              setCurrentUserReactions(prev => {
                const newReactions = { ...prev }
                delete newReactions[postId]
                return newReactions
              })
              return {
                ...post,
                reactionCounts: {
                  ...post.reactionCounts,
                  [reaction]: Math.max(0, currentCount - 1)
                }
              }
            } else {
              setCurrentUserReactions(prev => ({
                ...prev,
                [postId]: reaction
              }))
              return {
                ...post,
                reactionCounts: {
                  ...post.reactionCounts,
                  [reaction]: currentCount + 1
                }
              }
            }
          }
          return post
        }))
      }
    } catch (error) {
      console.error('Error reacting to post:', error)
      toast.error('Erreur lors de la réaction')
    } finally {
      setReactingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const handleReactionWithSelector = (postId: string) => {
    if (!isMember) return
    
    setShowReactionSelector(postId)
    
    if (reactionTimeout) {
      clearTimeout(reactionTimeout)
    }
    
    const timeout = setTimeout(() => {
      setShowReactionSelector(null)
    }, 2000)
    
    setReactionTimeout(timeout)
  }

  const handleSavePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/save`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.action === 'saved') {
          setSavedPosts(prev => new Set(prev).add(postId))
          toast.success('Post sauvegardé !')
        } else {
          setSavedPosts(prev => {
            const newSet = new Set(prev)
            newSet.delete(postId)
            return newSet
          })
          toast.success('Post retiré des sauvegardes')
        }
      }
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleShare = async (postId: string, platform?: string) => {
    const shareUrl = `${window.location.origin}/groups/${groupId}/posts/${postId}`
    
    if (platform === 'copy') {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Lien copié !')
      return
    }
    
    if (navigator.share && !platform) {
      try {
        await navigator.share({
          title: 'Partager ce post',
          url: shareUrl
        })
        
        await fetch(`/api/groups/${groupId}/posts/${postId}/share`, {
          method: 'POST'
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback pour le web
      const shareData = {
        title: 'Partager sur',
        items: [
          { label: 'Copier le lien', icon: Copy, action: () => handleShare(postId, 'copy') },
          { label: 'LinkedIn', icon: Briefcase, action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank') },
          { label: 'Twitter', icon: Users, action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, '_blank') },
          { label: 'Facebook', icon: Users, action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank') }
        ]
      }
      
      // Vous pourriez vouloir afficher un menu de partage personnalisé ici
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Lien copié dans le presse-papier !')
    }
  }

  const getTopReactions = (post: Post) => {
    const reactions = Object.entries(post.reactionCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    
    return reactions.map(([type]) => REACTION_EMOJIS[type as ReactionType]).join(' ')
  }

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex justify-between w-full">
                <Skeleton className="h-10 w-24 rounded-full" />
                <Skeleton className="h-10 w-24 rounded-full" />
                <Skeleton className="h-10 w-24 rounded-full" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs de filtrage */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4">
        <Tabs value={activeTab} onValueChange={(v: any) => { setActiveTab(v); setPage(1) }}>
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="all">
              <MessageSquare className="h-4 w-4 mr-2" />
              Tous
            </TabsTrigger>
            <TabsTrigger value="featured">
              <Star className="h-4 w-4 mr-2" />
              En vedette
            </TabsTrigger>
            <TabsTrigger value="pinned">
              <BookmarkCheck className="h-4 w-4 mr-2" />
              Épinglés
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Événements
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="h-4 w-4 mr-2" />
              Emplois
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <Card 
          key={post._id} 
          className="group hover:shadow-xl transition-all duration-300 border-gray-200 overflow-hidden"
        >
          {/* Badge pour contenu sponsorisé */}
          {post.isSponsored && (
            <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500">
              <div className="flex items-center gap-2 text-white text-xs font-medium">
                <Zap className="h-3 w-3" />
                Contenu sponsorisé
              </div>
            </div>
          )}

          {/* Header du post */}
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-white ring-offset-2">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {post.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {post.author.isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{post.author.name}</span>
                      {post.author.isVerified && (
                        <Badge variant="outline" className="h-5 px-2 bg-blue-50 text-blue-600 border-blue-200">
                          ✓ Vérifié
                        </Badge>
                      )}
                      {post.authorRole && (
                        <Badge variant="outline" className={`text-xs ${
                          post.authorRole === 'owner' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          post.authorRole === 'admin' ? 'bg-red-50 text-red-800 border-red-200' :
                          post.authorRole === 'moderator' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          'bg-gray-50 text-gray-800 border-gray-200'
                        }`}>
                          {post.authorRole === 'owner' ? '👑 Propriétaire' :
                           post.authorRole === 'admin' ? '⚡ Admin' :
                           post.authorRole === 'moderator' ? '🛡️ Modérateur' : '👤 Membre'}
                        </Badge>
                      )}
                    </div>
                    
                    {post.author.title && (
                      <span className="text-sm text-gray-600 hidden md:inline">
                        {post.author.title}
                        {post.author.company && ` • ${post.author.company}`}
                      </span>
                    )}
                    
                    <span className="ml-auto text-xs text-gray-500">
                      {formatDistanceToNow(new Date(post.createdAt), { 
                        addSuffix: true,
                        locale: fr 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <Badge variant="outline" className={`text-xs ${
                      post.type === 'event' ? 'bg-green-50 text-green-800 border-green-200' :
                      post.type === 'job' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      post.type === 'announcement' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                      post.type === 'question' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                      'bg-gray-50 text-gray-800 border-gray-200'
                    }`}>
                      {post.type === 'job' ? '💼 Offre' : 
                       post.type === 'event' ? '📅 Événement' : 
                       post.type === 'question' ? '❓ Question' : 
                       post.type === 'announcement' ? '📢 Annonce' : '💬 Discussion'}
                    </Badge>
                    
                    {post.isPinned && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200">
                        📌 Épinglé
                      </Badge>
                    )}
                    
                    {post.isFeatured && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        ⭐ En vedette
                      </Badge>
                    )}
                    
                    <span className="flex items-center gap-1 text-xs">
                      <Eye className="h-3 w-3" />
                      {post.viewCount.toLocaleString()} vues
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Menu d'actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleSavePost(post._id)}>
                    {savedPosts.has(post._id) ? (
                      <>
                        <BookmarkCheck className="h-4 w-4 mr-2" />
                        Retirer des sauvegardes
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(post._id)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier le lien
                  </DropdownMenuItem>
                  
                  {(userRole === 'admin' || userRole === 'owner' || userRole === 'moderator') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Star className="h-4 w-4 mr-2" />
                        Mettre en vedette
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <BookmarkCheck className="h-4 w-4 mr-2" />
                        Épingler
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Flag className="h-4 w-4 mr-2" />
                    Signaler
                  </DropdownMenuItem>
                  {(userRole === 'admin' || userRole === 'owner') && (
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer le post
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          {/* Contenu du post */}
          <CardContent className="pb-4">
            <h3 className="font-bold text-2xl mb-4 text-gray-900">{post.title}</h3>
            
            <div className="prose prose-lg max-w-none mb-6">
              <div className="text-gray-800 whitespace-pre-line leading-relaxed">
                {post.content}
              </div>
            </div>

            {/* Affichage spécifique selon le type */}
            {post.type === 'poll' && post.pollData && (
              <PollDisplay 
                pollData={post.pollData} 
                postId={post._id} 
                groupId={groupId} 
                isMember={isMember} 
              />
            )}
            
            {post.type === 'event' && post.eventData && (
              <EventDisplay eventData={post.eventData} />
            )}
            
            {post.type === 'job' && post.jobData && (
              <JobDisplay jobData={post.jobData} />
            )}

            {/* Galerie d'images/vidéos */}
            {(post.images && post.images.length > 0) || (post.videos && post.videos.length > 0) ? (
              <div className="mt-6">
                <Carousel
                  ref={(el) => { carouselRefs.current[post._id] = el }}
                  className="w-full"
                >
                  <CarouselContent>
                    {post.images?.map((image, index) => (
                      <CarouselItem key={`image-${index}`}>
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
                          <Image
                            src={image}
                            alt={`Image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                      </CarouselItem>
                    ))}
                    {post.videos?.map((video, index) => (
                      <CarouselItem key={`video-${index}`}>
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black">
                          <video
                            src={video}
                            controls
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute bottom-4 left-4">
                            <Badge className="bg-black/70 text-white">
                              <Video className="h-3 w-3 mr-1" />
                              Vidéo
                            </Badge>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {(post.images && post.images.length > 1) || (post.videos && post.videos.length > 1) ? (
                    <>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </>
                  ) : null}
                </Carousel>
              </div>
            ) : null}

            {/* Métriques avancées */}
            <PostMetrics metrics={post.metrics} />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {post.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs hover:bg-gray-200 cursor-pointer transition-colors px-3 py-1"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
          
          {/* Footer avec actions sociales */}
          <CardFooter className="pt-4 border-t flex flex-col gap-4">
            {/* Barre de réactions */}
            <div className="flex items-center justify-between w-full">
              {/* Réactions summary */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {getTopReactions(post) && (
                    <span className="text-sm">{getTopReactions(post)}</span>
                  )}
                </div>
                {(Object.values(post.reactionCounts).reduce((a, b) => a + b, 0) > 0) && (
                  <span className="text-sm text-gray-600 font-medium">
                    {Object.values(post.reactionCounts).reduce((a, b) => a + b, 0).toLocaleString()}
                  </span>
                )}
              </div>
              
              {/* Commentaires et partages */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedPostForComments(post._id)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  {post.commentCount > 0 && (
                    <span className="font-medium">{post.commentCount}</span>
                  )}
                </button>
                
                <button 
                  onClick={() => handleShare(post._id)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <Share2 className="h-4 w-4" />
                  {post.shareCount > 0 && (
                    <span className="font-medium">{post.shareCount}</span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Actions principales */}
            <div className="grid grid-cols-3 gap-2 w-full">
              {/* Bouton de réaction */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-12 relative"
                  onMouseEnter={() => handleReactionWithSelector(post._id)}
                  onClick={() => {
                    const currentReaction = currentUserReactions[post._id]
                    if (currentReaction) {
                      handleReaction(post._id, currentReaction) // Retirer la réaction
                    } else {
                      handleReaction(post._id, 'like') // Ajouter "like" par défaut
                    }
                  }}
                  disabled={reactingPosts.has(post._id) || !isMember}
                >
                  {currentUserReactions[post._id] ? (
                    <>
                      <span className={REACTION_COLORS[currentUserReactions[post._id]]}>
                        {REACTION_EMOJIS[currentUserReactions[post._id]]}
                      </span>
                      <span className={REACTION_COLORS[currentUserReactions[post._id]]}>
                        {currentUserReactions[post._id] === 'like' ? 'J\'aime' :
                         currentUserReactions[post._id] === 'love' ? 'J\'adore' :
                         currentUserReactions[post._id] === 'insightful' ? 'Intéressant' :
                         currentUserReactions[post._id] === 'helpful' ? 'Utile' : 'Célébrer'}
                      </span>
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="h-5 w-5" />
                      <span>J'aime</span>
                    </>
                  )}
                </Button>
                
                {showReactionSelector === post._id && (
                  <ReactionSelector
                    onSelect={(reaction) => {
                      handleReaction(post._id, reaction)
                      setShowReactionSelector(null)
                      if (reactionTimeout) {
                        clearTimeout(reactionTimeout)
                      }
                    }}
                    onMouseEnter={() => {
                      if (reactionTimeout) {
                        clearTimeout(reactionTimeout)
                      }
                    }}
                    onMouseLeave={() => {
                      const timeout = setTimeout(() => {
                        setShowReactionSelector(null)
                      }, 500)
                      setReactionTimeout(timeout)
                    }}
                  />
                )}
              </div>
              
              {/* Bouton commentaire */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-12"
                onClick={() => setSelectedPostForComments(post._id)}
              >
                <MessageSquare className="h-5 w-5" />
                <span>Commenter</span>
              </Button>
              
              {/* Bouton partage */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-12"
                  >
                    <Share2 className="h-5 w-5" />
                    <span>Partager</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleShare(post._id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier le lien
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(post._id, 'linkedin')}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Partager sur LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(post._id, 'twitter')}>
                    <Users className="h-4 w-4 mr-2" />
                    Partager sur Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(post._id, 'facebook')}>
                    <Users className="h-4 w-4 mr-2" />
                    Partager sur Facebook
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardFooter>
        </Card>
      ))}

      {/* Dialog pour les commentaires */}
 // Modifiez la section Dialog pour les commentaires :

{/* Dialog pour les commentaires */}
<Dialog open={!!selectedPostForComments} onOpenChange={(open) => !open && setSelectedPostForComments(null)}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
    <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
      <DialogTitle className="text-xl font-semibold">
        Commentaires
      </DialogTitle>
    </DialogHeader>
    {selectedPostForComments && (
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-6 pb-6">
              <CommentsSection 
                postId={selectedPostForComments}
                groupId={groupId}
                initialComments={[]} // Vous devriez charger les commentaires ici
              />
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

      {/* Pagination améliorée */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={() => setPage(prev => prev + 1)}
            disabled={loading}
            className="gap-3 px-8 py-6 rounded-xl border-2 hover:border-primary transition-all duration-300"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <span>Voir plus de posts</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-6">
            <MessageSquare className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Aucun post pour l'instant</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
            {isMember 
              ? 'Soyez le premier à partager quelque chose dans ce groupe !'
              : 'Rejoignez le groupe pour voir les posts et participer.'}
          </p>
          {isMember && (
            <Button size="lg" className="gap-3 px-8 py-6 rounded-xl text-lg">
              <MessageSquare className="h-5 w-5" />
              Créer le premier post
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Composants pour les autres onglets (améliorés)
export function GroupEvents({ groupId, isMember }: GroupPostsProps) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-6">
        <Calendar className="h-10 w-10 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold mb-3">Événements du groupe</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg">
        Découvrez les événements à venir organisés par le groupe.
      </p>
      {isMember && (
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="gap-3 px-8 py-6 rounded-xl text-lg bg-gradient-to-r from-green-500 to-emerald-600">
            <Calendar className="h-5 w-5" />
            Créer un événement
          </Button>
          <Button size="lg" variant="outline" className="gap-3 px-8 py-6 rounded-xl text-lg">
            <Users className="h-5 w-5" />
            Voir le calendrier
          </Button>
        </div>
      )}
    </div>
  )
}

export function GroupMembers({ groupId }: { groupId: string }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
        <Users className="h-10 w-10 text-purple-600" />
      </div>
      <h3 className="text-2xl font-bold mb-3">Membres du groupe</h3>
      <p className="text-gray-600 mb-4">Connectez-vous avec les autres membres.</p>
    </div>
  )
}

export function GroupJobs({ groupId, isMember }: GroupPostsProps) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
        <Briefcase className="h-10 w-10 text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold mb-3">Offres d'emploi</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg">
        Trouvez des opportunités de carrière partagées par les membres du groupe.
      </p>
      {isMember && (
        <Button size="lg" className="gap-3 px-8 py-6 rounded-xl text-lg bg-gradient-to-r from-blue-500 to-indigo-600">
          <Briefcase className="h-5 w-5" />
          Poster une offre
        </Button>
      )}
    </div>
  )
}