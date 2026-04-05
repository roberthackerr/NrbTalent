// components/PostCard/PostContent.tsx
'use client'

import Image from 'next/image'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Badge } from '@/components/ui/badge'
import { Video, ImageIcon, FileText } from 'lucide-react'
import { Post } from '../utils/types'
import { motion } from 'framer-motion'

interface PostContentProps {
  post: Post
  dict?: any
  lang?: string
}

export function PostContent({ post, dict, lang = 'fr' }: PostContentProps) {
  const hasMedia = (post.images && post.images.length > 0) || (post.videos && post.videos.length > 0)
  
  const t = dict?.feed || {
    video: 'Vidéo',
    image: 'Image'
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {post.title && (
        <h3 className="font-bold text-2xl mb-4 text-gray-900 dark:text-white">
          {post.title}
        </h3>
      )}
      
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <div className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
          {post.content}
        </div>
      </div>

      {/* Galerie d'images/vidéos */}
      {hasMedia && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Carousel className="w-full">
            <CarouselContent>
              {post.images?.map((image, index) => (
                <CarouselItem key={`image-${index}`}>
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 group">
                    <Image
                      src={image.url}
                      alt={`${t.image} ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-black/70 text-white backdrop-blur-sm">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {t.image}
                      </Badge>
                    </div>
                  </div>
                </CarouselItem>
              ))}
              {post.videos?.map((video, index) => (
                <CarouselItem key={`video-${index}`}>
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black group">
                    <video
                      src={video.url}
                      controls
                      className="w-full h-full object-contain"
                      poster={video.thumbnail}
                    />
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-black/70 text-white backdrop-blur-sm">
                        <Video className="h-3 w-3 mr-1" />
                        {t.video}
                      </Badge>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {((post.images && post.images.length > 1) || (post.videos && post.videos.length > 1)) && (
              <>
                <CarouselPrevious className="left-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800" />
                <CarouselNext className="right-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800" />
              </>
            )}
          </Carousel>
        </motion.div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 mt-6"
        >
          {post.tags.map(tag => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="text-xs hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              #{tag}
            </Badge>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}