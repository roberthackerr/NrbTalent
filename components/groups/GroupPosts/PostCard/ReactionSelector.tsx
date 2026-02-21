import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { REACTION_EMOJIS, REACTION_LABELS, REACTION_COLORS } from '../utils/constants'
import { ReactionType } from '../utils/types'

interface ReactionSelectorProps {
  onSelect: (reaction: ReactionType) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function ReactionSelector({ onSelect, onMouseEnter, onMouseLeave }: ReactionSelectorProps) {
  const reactions = Object.entries(REACTION_EMOJIS) as [ReactionType, string][]

  return (
    <div 
      className="absolute -top-14 left-0 bg-white shadow-2xl rounded-full px-3 py-2.5 flex items-center gap-2.5 border border-gray-200/80 backdrop-blur-sm"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
      }}
    >
      {reactions.map(([type, emoji]) => (
        <TooltipProvider key={type}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelect(type)}
                className={`
                  w-10 h-10 flex items-center justify-center text-xl 
                  rounded-full hover:scale-125 active:scale-110 
                  transition-all duration-200 ease-out
                  hover:shadow-md
                  ${REACTION_COLORS[type].replace('text', 'hover:bg')}
                  hover:bg-opacity-10
                `}
              >
                <span className="transition-transform duration-300 hover:scale-110">
                  {emoji}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="px-3 py-1.5 text-sm font-medium"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">{emoji}</span>
                <span>{REACTION_LABELS[type]}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}