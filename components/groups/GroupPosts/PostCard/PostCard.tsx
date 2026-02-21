import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Post } from '../utils/types'
import { PostHeader } from './PostHeader'
import { PostContent } from './PostContent'
import { PostActions } from './PostActions'
import { PollDisplay } from '../Polls/PollDisplay'
import { EventDisplay } from '../Events/EventDisplay'
import { JobDisplay } from '../Jobs/JobDisplay'
import { PostMetrics } from './PostMetrics'

interface PostCardProps {
  post: Post
  groupId: string
  isMember: boolean
  userRole?: string
  isSaved: boolean
  userReaction?: string
  isReacting: boolean
  onSave: (postId: string) => void
  onShare: (postId: string, platform?: string) => void
  onReaction: (postId: string, reaction: any) => void
  onComment: (postId: string) => void
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
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
  onDelete
}: PostCardProps) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-gray-200 overflow-hidden">
      {/* Badge pour contenu sponsorisé */}
      {post.isSponsored && (
        <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500">
          <div className="flex items-center gap-2 text-white text-xs font-medium">
            ⚡ Contenu sponsorisé
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
        />
      </CardHeader>
      
      {/* Contenu du post */}
      <CardContent className="pb-4">
        <PostContent post={post} />

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
          <EventDisplay 
            eventData={post.eventData} 
            postId={post._id}
            groupId={groupId}
            isMember={isMember}
          />
        )}
        
        {post.type === 'job' && post.jobData && (
          <JobDisplay 
            jobData={post.jobData}
            postId={post._id}
            groupId={groupId}
            isMember={isMember}
          />
        )}

        {/* Métriques avancées */}
        <PostMetrics metrics={post.metrics} />
      </CardContent>
      
      {/* Footer avec actions sociales - CORRECTION ICI */}
      <CardFooter className="pt-4 border-t p-0">
        <div className="w-full px-6 pb-6">
          <PostActions
            postId={post._id}
            reactionCounts={post.reactionCounts}
            commentCount={post.commentCount}
            shareCount={post.shareCount}
            userReaction={userReaction as any}
            onReaction={(reaction) => onReaction(post._id, reaction)}
            onComment={() => onComment(post._id)}
            onShare={(platform) => onShare(post._id, platform)}
            isMember={isMember}
            isReacting={isReacting}
          />
        </div>
      </CardFooter>
    </Card>
  )
}