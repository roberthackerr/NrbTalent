import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MessageSquare, Share2, ThumbsUp, Copy, Linkedin, Twitter, Facebook, MoreHorizontal } from 'lucide-react'
import { ReactionSelector } from './ReactionSelector'
import { REACTION_COLORS, REACTION_EMOJIS, REACTION_LABELS } from '../utils/constants'
import { getTopReactions } from '../utils/helpers'
import { ReactionType } from '../utils/types'

interface PostActionsProps {
  postId: string
  reactionCounts: Record<ReactionType, number>
  commentCount: number
  shareCount: number
  userReaction?: ReactionType
  onReaction: (reaction: ReactionType) => void
  onComment: () => void
  onShare: (platform?: string) => void
  isMember: boolean
  isReacting: boolean
}

export function PostActions({
  postId,
  reactionCounts,
  commentCount,
  shareCount,
  userReaction,
  onReaction,
  onComment,
  onShare,
  isMember,
  isReacting
}: PostActionsProps) {
  const [showReactionSelector, setShowReactionSelector] = useState(false)
  const [reactionTimeout, setReactionTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleReactionWithSelector = () => {
    if (!isMember) return
    
    setShowReactionSelector(true)
    
    if (reactionTimeout) {
      clearTimeout(reactionTimeout)
    }
    
    const timeout = setTimeout(() => {
      setShowReactionSelector(false)
    }, 2500)
    
    setReactionTimeout(timeout)
  }

  const handleReactionSelect = (reaction: ReactionType) => {
    onReaction(reaction)
    setShowReactionSelector(false)
    if (reactionTimeout) {
      clearTimeout(reactionTimeout)
    }
  }

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Barre de stats */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          {totalReactions > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors cursor-default">
                    <div className="flex -space-x-1.5">
                      {getTopReactions({ reactionCounts } as any) && (
                        <span className="text-base leading-none">{getTopReactions({ reactionCounts } as any)}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {totalReactions.toLocaleString()}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="px-3 py-1.5">
                  <p>Réactions totales</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Stats droite */}
        <div className="flex items-center gap-4">
          {commentCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={onComment}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors group"
                  >
                    <MessageSquare className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">
                      {commentCount}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="px-3 py-1.5">
                  <p>{commentCount} commentaire{commentCount > 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {shareCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => onShare()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors group"
                  >
                    <Share2 className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">
                      {shareCount}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="px-3 py-1.5">
                  <p>{shareCount} partage{shareCount > 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      {/* Séparateur */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      
      {/* Actions principales */}
      <div className="grid grid-cols-3 gap-3">
        {/* Bouton de réaction */}
        <div className="relative">
          <Button
            variant="ghost"
            size="lg"
            className="w-full h-12 gap-2.5 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 group relative overflow-hidden"
            onMouseEnter={handleReactionWithSelector}
            onClick={() => {
              if (userReaction) {
                onReaction(userReaction)
              } else {
                onReaction('like')
              }
            }}
            disabled={isReacting || !isMember}
          >
            <div className="flex items-center gap-2.5">
              {userReaction ? (
                <>
                  <span className={`text-xl ${REACTION_COLORS[userReaction]} transition-transform group-hover:scale-110`}>
                    {REACTION_EMOJIS[userReaction]}
                  </span>
                  <span className={`font-medium ${REACTION_COLORS[userReaction]}`}>
                    {REACTION_LABELS[userReaction]}
                  </span>
                </>
              ) : (
                <>
                  <ThumbsUp className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    J'aime
                  </span>
                </>
              )}
            </div>
            {isReacting && (
              <div className="absolute inset-0 bg-gray-50/50 flex items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
              </div>
            )}
          </Button>
          
          {showReactionSelector && (
            <ReactionSelector
              onSelect={handleReactionSelect}
              onMouseEnter={() => {
                if (reactionTimeout) {
                  clearTimeout(reactionTimeout)
                }
              }}
              onMouseLeave={() => {
                const timeout = setTimeout(() => {
                  setShowReactionSelector(false)
                }, 800)
                setReactionTimeout(timeout)
              }}
            />
          )}
        </div>
        
        {/* Bouton commentaire */}
        <Button
          variant="ghost"
          size="lg"
          className="w-full h-12 gap-2.5 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 group"
          onClick={onComment}
        >
          <MessageSquare className="h-5 w-5 text-gray-600 group-hover:text-green-600 transition-colors" />
          <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">
            Commenter
          </span>
        </Button>
        
        {/* Bouton partage */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="lg"
              className="w-full h-12 gap-2.5 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 group"
            >
              <Share2 className="h-5 w-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
              <span className="font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
                Partager
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 p-2 rounded-xl shadow-xl border border-gray-100"
          >
            <DropdownMenuItem 
              onClick={() => onShare('copy')}
              className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 gap-2.5"
            >
              <Copy className="h-4 w-4 text-gray-500" />
              <div className="flex flex-col">
                <span className="font-medium text-gray-800">Copier le lien</span>
                <span className="text-xs text-gray-500">Coller n'importe où</span>
              </div>
            </DropdownMenuItem>
            <div className="h-px bg-gray-100 my-1" />
            <div className="px-3 py-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Partager sur
              </p>
              <div className="flex items-center justify-between gap-1">
                <button
                  onClick={() => onShare('linkedin')}
                  className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Linkedin className="h-5 w-5 text-[#0077B5]" />
                  <span className="text-xs font-medium">LinkedIn</span>
                </button>
                <button
                  onClick={() => onShare('twitter')}
                  className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-sky-50 transition-colors"
                >
                  <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                  <span className="text-xs font-medium">Twitter</span>
                </button>
                <button
                  onClick={() => onShare('facebook')}
                  className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Facebook className="h-5 w-5 text-[#1877F2]" />
                  <span className="text-xs font-medium">Facebook</span>
                </button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}