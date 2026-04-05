// components/PostCard/PostCard.tsx
'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Post } from '../utils/types'
import { PostHeader } from './PostHeader'
import { PostContent } from './PostContent'
import { PostActions } from './PostActions'
import { PollDisplay } from '../Polls/PollDisplay'
import { EventDisplay } from '../Events/EventDisplay'
import { JobDisplay } from '../Jobs/JobDisplay'
import { PostMetrics } from './PostMetrics'
import { ReactionType } from '../utils/types'
import { motion } from 'framer-motion'

interface PostCardProps {
  post: Post
  groupId: string
  isMember: boolean
  userRole?: string
  isSaved: boolean
  userReaction?: ReactionType
  isReacting: boolean
  onSave: (postId: string) => void
  onShare: (postId: string, platform?: string) => void
  onReaction: (postId: string, reaction: ReactionType) => void
  onComment: (postId: string) => void
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
  dict?: any
  lang?: string
  expanded?: boolean
}

export function PostCard({
  post,
  groupId,
  isMember,
  userRole,
  isSaved,
  userReaction,
  isReacting,
  onSave,
  onShare,
  onReaction,
  onComment,
  onEdit,
  onDelete,
  dict,
  lang = 'fr',
  expanded = false
}: PostCardProps) {
  
  const t = dict?.feed || {
    sponsored: 'Contenu sponsorisé'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: expanded ? 0 : -2 }}
    >
      <Card className={`group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 ${
        expanded ? 'shadow-2xl' : ''
      }`}>
        {/* Badge pour contenu sponsorisé */}
        {post.isSponsored && (
          <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500">
            <div className="flex items-center gap-2 text-white text-xs font-medium">
              <span className="text-sm">⚡</span>
              <span>{t.sponsored}</span>
            </div>
          </div>
        )}

        {/* Header du post */}
        <CardHeader className="pb-4">
          <PostHeader
            post={post}
            onSave={() => onSave(post._id)}
            onShare={() => onShare(post._id)}
            onEdit={onEdit ? () => onEdit(post._id) : undefined}
            onDelete={onDelete ? () => onDelete(post._id) : undefined}
            isSaved={isSaved}
            userRole={userRole}
            dict={dict}
            lang={lang}
          />
        </CardHeader>
        
        {/* Contenu du post */}
        <CardContent className="pb-4">
          <PostContent 
            post={post} 
            dict={dict} 
            lang={lang} 
          />

          {/* Affichage spécifique selon le type */}
          {post.type === 'poll' && post.pollData && (
            <PollDisplay 
              pollData={post.pollData} 
              postId={post._id} 
              groupId={groupId} 
              isMember={isMember}
              dict={dict}
              lang={lang}
            />
          )}
          
          {post.type === 'event' && post.eventData && (
            <EventDisplay 
              eventData={post.eventData} 
              postId={post._id}
              groupId={groupId}
              isMember={isMember}
              dict={dict}
              lang={lang}
            />
          )}
          
          {post.type === 'job' && post.jobData && (
            <JobDisplay 
              jobData={post.jobData}
              postId={post._id}
              groupId={groupId}
              isMember={isMember}
              dict={dict}
              lang={lang}
            />
          )}

          {/* Métriques avancées */}
          {post.metrics && (
            <PostMetrics 
              metrics={post.metrics} 
              dict={dict}
              lang={lang}
            />
          )}
        </CardContent>
        
        {/* Footer avec actions sociales */}
        <CardFooter className="pt-4 border-t border-gray-200 dark:border-gray-800 p-0">
          <div className="w-full px-6 pb-6">
            <PostActions
              postId={post._id}
              reactionCounts={post.reactionCounts}
              commentCount={post.commentCount}
              shareCount={post.shareCount}
              userReaction={userReaction}
              onReaction={(reaction) => onReaction(post._id, reaction)}
              onComment={() => onComment(post._id)}
              onShare={(platform) => onShare(post._id, platform)}
              isMember={isMember}
              isReacting={isReacting}
              dict={dict}
              lang={lang}
            />
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}