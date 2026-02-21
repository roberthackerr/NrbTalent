// /components/ui/emoji-picker.tsx
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Smile } from 'lucide-react'

const emojiCategories = [
  {
    name: 'Smileys & People',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠']
  },
  {
    name: 'Objects',
    emojis: ['💯', '💢', '💬', '💭', '💤', '💮', '💥', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '💮', '💥', '💦', '💨', '🕳️', '💣']
  },
  {
    name: 'Symbols',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭']
  }
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)

  const filteredEmojis = emojiCategories.flatMap(category => 
    category.emojis.filter(emoji => 
      emoji.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji)
    setIsOpen(false)
  }

  // Fermer le popover en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        ref={popoverRef}
        className="w-80 p-3 max-h-96 overflow-y-auto"
        align="end"
      >
        <div className="space-y-3">
          {/* Barre de recherche */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un emoji..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Liste des emojis */}
          <div className="space-y-3">
            {searchTerm ? (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Résultats ({filteredEmojis.length})
                </h4>
                <div className="grid grid-cols-8 gap-1">
                  {filteredEmojis.map((emoji, index) => (
                    <button
                      key={`${emoji}-${index}`}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="h-8 w-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-md transition-colors"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              emojiCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {category.name}
                  </h4>
                  <div className="grid grid-cols-8 gap-1">
                    {category.emojis.map((emoji, index) => (
                      <button
                        key={`${category.name}-${emoji}-${index}`}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="h-8 w-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-md transition-colors"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Aucun résultat */}
          {searchTerm && filteredEmojis.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">Aucun emoji trouvé</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}