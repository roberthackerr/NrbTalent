// components/PostCard/PostHeader.tsx
'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Bookmark, BookmarkCheck, Share2, Copy, Star, Edit, Trash2, Flag, Shield, Crown, UserCheck } from 'lucide-react'
import { Post } from '../utils/types'
import { ROLE_CONFIG, POST_TYPES } from '../utils/constants'
import { formatDate } from '../utils/helpers'
import { motion } from 'framer-motion'

interface PostHeaderProps {
  post: Post
  onSave: () => void
  onShare: () => void
  onEdit?: () => void
  onDelete?: () => void
  isSaved: boolean
  userRole?: string
  showDropdown?: boolean
  dict?: any
  lang?: string
}

export function PostHeader({ 
  post, 
  onSave, 
  onShare, 
  onEdit, 
  onDelete, 
  isSaved, 
  userRole,
  showDropdown = true,
  dict,
  lang = 'fr'
}: PostHeaderProps) {
  const postType = POST_TYPES[post.type]
  const roleConfig = post.authorRole ? ROLE_CONFIG[post.authorRole] : null
  
  const t = dict?.feed || {
    verified: 'Vérifié',
    pinned: 'Épinglé',
    featured: 'En vedette',
    views: 'vues',
    save: 'Sauvegarder',
    unsave: 'Retirer des sauvegardes',
    share: 'Partager',
    copyLink: 'Copier le lien',
    feature: 'Mettre en vedette',
    pin: 'Épingler',
    edit: 'Modifier',
    report: 'Signaler',
    delete: 'Supprimer le post',
    member: 'Membre',
    moderator: 'Modérateur',
    admin: 'Administrateur',
    owner: 'Propriétaire'
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3 mr-1" />
      case 'owner': return <Crown className="h-3 w-3 mr-1" />
      case 'moderator': return <UserCheck className="h-3 w-3 mr-1" />
      default: return null
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start justify-between"
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-800 ring-offset-2 dark:ring-offset-gray-900">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {post.author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {post.author.isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 dark:text-white">
                {post.author.name}
              </span>
              {post.author.isVerified && (
                <Badge variant="outline" className="h-5 px-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                  ✓ {t.verified}
                </Badge>
              )}
              {roleConfig && (
                <Badge variant="outline" className={`text-xs ${roleConfig.color} dark:bg-opacity-20`}>
                  {getRoleIcon(post.authorRole)}
                  {roleConfig.label}
                </Badge>
              )}
            </div>
            
            {post.author.title && (
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden md:inline">
                {post.author.title}
                {post.author.company && ` • ${post.author.company}`}
              </span>
            )}
            
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">
              {formatDate(post.createdAt, lang)}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline" className={`text-xs ${postType.color} dark:bg-opacity-20`}>
              {postType.icon} {postType.label}
            </Badge>
            
            {post.isPinned && (
              <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                📌 {t.pinned}
              </Badge>
            )}
            
            {post.isFeatured && (
              <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                ⭐ {t.featured}
              </Badge>
            )}
            
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
              👁️ {post.viewCount.toLocaleString()} {t.views}
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
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <DropdownMenuItem onClick={onSave} className="cursor-pointer">
              {isSaved ? (
                <>
                  <BookmarkCheck className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                  {t.unsave}
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4 mr-2" />
                  {t.save}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShare} className="cursor-pointer">
              <Share2 className="h-4 w-4 mr-2" />
              {t.share}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Copy className="h-4 w-4 mr-2" />
              {t.copyLink}
            </DropdownMenuItem>
            
            {(userRole === 'admin' || userRole === 'owner' || userRole === 'moderator') && (
              <>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />
                <DropdownMenuItem className="cursor-pointer">
                  <Star className="h-4 w-4 mr-2 text-yellow-600" />
                  {t.feature}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <BookmarkCheck className="h-4 w-4 mr-2 text-amber-600" />
                  {t.pin}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  {t.edit}
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />
            <DropdownMenuItem className="text-red-600 dark:text-red-400 cursor-pointer">
              <Flag className="h-4 w-4 mr-2" />
              {t.report}
            </DropdownMenuItem>
            {(userRole === 'admin' || userRole === 'owner') && onDelete && (
              <DropdownMenuItem className="text-red-600 dark:text-red-400 cursor-pointer" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t.delete}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </motion.div>
  )
}