'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Users, Check, Clock, AlertCircle } from 'lucide-react'
import { PollData } from '../utils/types'
import { toast } from 'sonner'

interface PollDisplayProps {
  pollData: PollData
  postId: string
  groupId: string
  isMember: boolean
}

export function PollDisplay({ pollData, postId, groupId, isMember }: PollDisplayProps) {
  const [voted, setVoted] = useState(pollData.voted || false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    pollData.options.filter(opt => opt.voted).map(opt => opt.id) || []
  )
  const [loading, setLoading] = useState(false)

  const handleVote = async () => {
    if (!isMember || selectedOptions.length === 0 || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/posts/${postId}/poll/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          optionIds: selectedOptions,
          multipleChoice: pollData.multipleChoice 
        })
      })

      if (response.ok) {
        const data = await response.json()
        setVoted(true)
        // Mettre à jour localement les données du sondage
        pollData.totalVotes = data.totalVotes
        pollData.options = data.options
        pollData.voted = true
        
        toast.success('Vote enregistré !')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors du vote')
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast.error('Erreur lors du vote')
    } finally {
      setLoading(false)
    }
  }

  const handleOptionSelect = (optionId: string) => {
    if (voted) return

    if (pollData.multipleChoice) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const hasEnded = pollData.endsAt && new Date(pollData.endsAt) < new Date()

  return (
    <Card className="mt-4 p-6 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Award className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Sondage</h4>
            {pollData.endsAt && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Clock className="h-3 w-3" />
                {hasEnded ? (
                  <span>Terminé le {new Date(pollData.endsAt).toLocaleDateString('fr-FR')}</span>
                ) : (
                  <span>Se termine le {new Date(pollData.endsAt).toLocaleDateString('fr-FR')}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {pollData.multipleChoice && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Choix multiples
          </Badge>
        )}
      </div>
      
      <p className="text-gray-800 font-medium mb-6 text-lg">{pollData.question}</p>
      
      <div className="space-y-4 mb-6">
        {pollData.options.map((option) => (
          <div key={option.id} className="relative">
            <button
              onClick={() => !voted && !hasEnded && handleOptionSelect(option.id)}
              disabled={voted || hasEnded}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ${
                selectedOptions.includes(option.id)
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : voted 
                    ? 'border-gray-200 bg-white hover:border-gray-300'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
              } ${(voted || hasEnded) ? 'cursor-default' : 'cursor-pointer hover:shadow-md'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${
                  selectedOptions.includes(option.id) ? 'text-blue-700' : 'text-gray-800'
                }`}>
                  {option.text}
                </span>
                {voted && (
                  <span className="text-sm font-semibold text-gray-700">
                    {option.percentage}%
                  </span>
                )}
              </div>
              
              {voted && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{option.votes} vote{option.votes !== 1 ? 's' : ''}</span>
                    <span>{option.percentage}%</span>
                  </div>
                  <Progress 
                    value={option.percentage} 
                    className="h-2 bg-gray-100"
                    indicatorClassName="bg-blue-500"
                  />
                </div>
              )}
              
              {selectedOptions.includes(option.id) && !voted && !hasEnded && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 animate-bounce">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="font-medium">{pollData.totalVotes}</span>
            <span>vote{pollData.totalVotes !== 1 ? 's' : ''}</span>
          </div>
          
          {pollData.multipleChoice && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              <span>Choix multiples autorisés</span>
            </div>
          )}
        </div>
        
        {!voted && !hasEnded ? (
          <Button
            onClick={handleVote}
            disabled={selectedOptions.length === 0 || loading || !isMember}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 min-w-[120px]"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Voter
                {selectedOptions.length > 0 && (
                  <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {selectedOptions.length}
                  </span>
                )}
              </>
            )}
          </Button>
        ) : hasEnded ? (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
            <Clock className="h-3 w-3 mr-1" />
            Sondage terminé
          </Badge>
        ) : (
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Vous avez voté</span>
          </div>
        )}
      </div>
    </Card>
  )
}