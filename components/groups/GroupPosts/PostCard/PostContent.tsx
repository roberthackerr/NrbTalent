import Image from 'next/image'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Badge } from '@/components/ui/badge'
import { Video } from 'lucide-react'
import { Post } from '../utils/types'

interface PostContentProps {
  post: Post
}

export function PostContent({ post }: PostContentProps) {
  const hasMedia = (post.images && post.images.length > 0) || (post.videos && post.videos.length > 0)

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-2xl mb-4 text-gray-900">{post.title}</h3>
      
      <div className="prose prose-lg max-w-none">
        <div className="text-gray-800 whitespace-pre-line leading-relaxed">
          {post.content}
        </div>
      </div>

      {/* Galerie d'images/vidéos */}
      {hasMedia && (
        <div className="mt-6">
          <Carousel className="w-full">
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
            {((post.images && post.images.length > 1) || (post.videos && post.videos.length > 1)) && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
        </div>
      )}

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
    </div>
  )
}