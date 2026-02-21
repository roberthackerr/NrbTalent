import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Bookmark, BookmarkCheck, Share2, Copy, Star, Edit, Trash2, Flag } from 'lucide-react'
import { Post } from '../utils/types'
import { ROLE_CONFIG, POST_TYPES } from '../utils/constants'
import { formatDate } from '../utils/helpers'

interface PostHeaderProps {
  post: Post
  onSave: () => void
  onShare: () => void
  onEdit?: () => void
  onDelete?: () => void
  isSaved: boolean
  userRole?: string
  showDropdown?: boolean
}

export function PostHeader({ 
  post, 
  onSave, 
  onShare, 
  onEdit, 
  onDelete, 
  isSaved, 
  userRole,
  showDropdown = true 
}: PostHeaderProps) {
  const postType = POST_TYPES[post.type]
  const roleConfig = post.authorRole ? ROLE_CONFIG[post.authorRole] : null

  return (
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
              {roleConfig && (
                <Badge variant="outline" className={`text-xs ${roleConfig.color}`}>
                  {roleConfig.label}
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
              {formatDate(post.createdAt)}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Badge variant="outline" className={`text-xs ${postType.color}`}>
              {postType.icon} {postType.label}
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
              👁️ {post.viewCount.toLocaleString()} vues
            </span>
          </div>
        </div>
      </div>
      
      {showDropdown && (
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
            <DropdownMenuItem onClick={onSave}>
              {isSaved ? (
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
            <DropdownMenuItem onClick={onShare}>
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
                <DropdownMenuItem onClick={onEdit}>
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
            {(userRole === 'admin' || userRole === 'owner') && onDelete && (
              <DropdownMenuItem className="text-red-600" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer le post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}