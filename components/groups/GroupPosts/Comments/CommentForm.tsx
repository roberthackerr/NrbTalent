// components/groups/GroupPosts/Comments/CommentForm.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Send, X, Smile, Loader2 } from 'lucide-react'

// Emojis populaires
const popularEmojis = ['😀', '😃', '😄', '😁', '😅', '😂', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😎', '🥳', '😢', '😭', '😡', '🤯', '🥶', '😱', '🤔', '🤫', '😴', '😷', '❤️', '👍', '👎', '🙏', '🔥', '💯', '✨', '🎉', '💪', '👏']

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  initialValue?: string
  onCancel?: () => void
  showCancel?: boolean
  autoFocus?: boolean
  dict?: any
  lang?: string
}

export function CommentForm({
  onSubmit,
  placeholder,
  initialValue = '',
  onCancel,
  showCancel = true,
  autoFocus = false,
  dict,
  lang = 'fr'
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

  const t = dict?.comments || {
    publish: 'Publier',
    cancel: 'Annuler',
    characterLimit: 'caractères',
    addComment: 'Ajouter un commentaire...'
  }

  const finalPlaceholder = placeholder || t.addComment || 'Ajouter un commentaire...'

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojis(false)
      }
    }
    
    if (showEmojis) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojis])

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

  const maxLength = 1000
  const remainingChars = maxLength - content.length
  const isNearLimit = remainingChars < 100
  const isOverLimit = remainingChars < 0

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          placeholder={finalPlaceholder}
          className={`min-h-[80px] flex-1 pr-12 resize-none bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 ${
            isOverLimit ? 'border-red-500 focus:border-red-500' : ''
          }`}
          onKeyDown={handleKeyDown}
          disabled={loading}
          maxLength={maxLength}
        />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setShowEmojis(!showEmojis)}
        >
          <Smile className="h-4 w-4" />
        </Button>
        
        {showEmojis && (
          <div 
            ref={emojiRef}
            className="absolute right-0 top-10 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3 w-80"
          >
            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
              {popularEmojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="h-9 w-9 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                😊 {Object.keys(popularEmojis).length} emojis disponibles
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || loading || isOverLimit}
            size="sm"
            className="px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {t.publish || 'Publier'}
          </Button>
          
          {showCancel && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={loading}
              className="px-4 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              {t.cancel || 'Annuler'}
            </Button>
          )}
        </div>
        
        <div className={`text-xs ${
          isOverLimit 
            ? 'text-red-500 dark:text-red-400 font-medium' 
            : isNearLimit 
              ? 'text-amber-500 dark:text-amber-400' 
              : 'text-gray-500 dark:text-gray-400'
        }`}>
          {content.length}/{maxLength} {t.characterLimit || 'caractères'}
          {isOverLimit && (
            <span className="ml-1">⚠️ Limite dépassée</span>
          )}
        </div>
      </div>
    </div>
  )
}