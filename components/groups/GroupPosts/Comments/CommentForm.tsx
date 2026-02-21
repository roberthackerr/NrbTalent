// /components/groups/GroupPosts/Comments/CommentForm.tsx
import { useState, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send, X, Smile } from 'lucide-react'

// Emojis populaires
const popularEmojis = ['😀', '😃', '😄', '😁', '😅', '😂', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😎', '🥳', '😢', '😭', '😡', '🤯', '🥶', '😱', '🤔', '🤫', '😴', '😷', '❤️', '👍', '👎', '🙏', '🔥', '💯', '✨', '🎉', '💪', '👏']

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  initialValue?: string
  onCancel?: () => void
  showCancel?: boolean
  autoFocus?: boolean
}

export function CommentForm({
  onSubmit,
  placeholder = 'Ajouter un commentaire...',
  initialValue = '',
  onCancel,
  showCancel = true,
  autoFocus = false
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent || loading) return

    setLoading(true)
    try {
      await onSubmit(trimmedContent)
      setContent('')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const insertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji)
    setShowEmojis(false)
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="min-h-[80px] flex-1 pr-10 resize-none"
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-8 w-8 p-0"
          onClick={() => setShowEmojis(!showEmojis)}
        >
          <Smile className="h-4 w-4" />
        </Button>
        
        {showEmojis && (
          <div className="absolute right-0 top-10 z-50 bg-white border rounded-lg shadow-lg p-2 w-64">
            <div className="grid grid-cols-8 gap-1">
              {popularEmojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="h-8 w-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-md transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || loading}
            size="sm"
            className="px-4"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publier
              </>
            )}
          </Button>
          
          {showCancel && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={loading}
              className="px-4"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          {content.length}/1000
        </div>
      </div>
    </div>
  )
}