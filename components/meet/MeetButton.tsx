// components/meet/MeetButton.tsx
'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Video, Sparkles, Users, ArrowRight, Loader2, Calendar, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MeetButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'gradient'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showIcon?: boolean
  label?: string
  dict?: any
  lang?: string
  onMeetingStart?: (roomId: string) => void
}

export function MeetButton({
  variant = 'gradient',
  size = 'default',
  className,
  showIcon = true,
  label,
  dict,
  lang,
  onMeetingStart
}: MeetButtonProps) {
  const router = useRouter()
  const params = useParams()
  const currentLang = lang || (params.lang as string) || 'fr'
  const [open, setOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [quickMeeting, setQuickMeeting] = useState(false)

  // Fallback dictionary
  const t = dict?.meetButton || {
    startMeeting: 'Start Meeting',
    joinMeeting: 'Join Meeting',
    instantMeeting: 'Instant Meeting',
    scheduleMeeting: 'Schedule Meeting',
    roomName: 'Room Name',
    roomNamePlaceholder: 'Enter room name (e.g., project-discussion)',
    randomRoom: 'Random',
    creating: 'Creating...',
    joining: 'Joining...',
    startNow: 'Start Now',
    join: 'Join',
    cancel: 'Cancel',
    createInstant: 'Create Instant Room',
    joinExisting: 'Join Existing Room',
    copyLink: 'Copy Link',
    linkCopied: 'Link copied!',
    description: 'Start a video call with anyone, anywhere',
    instantDescription: 'Create a room and invite others instantly',
    joinDescription: 'Join an existing meeting with a room name',
    recentMeetings: 'Recent Meetings'
  }

  const handleCreateInstantMeeting = async () => {
    setIsCreating(true)
    try {
      const roomId = `meet-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString().slice(-6)}`
      const meetingUrl = `/${currentLang}/meet?room=${roomId}`
      
      if (onMeetingStart) {
        onMeetingStart(roomId)
      }
      
      router.push(meetingUrl)
    } catch (error) {
      console.error('Error creating meeting:', error)
      toast.error(dict?.common?.error || 'Failed to create meeting')
    } finally {
      setIsCreating(false)
      setOpen(false)
    }
  }

  const handleJoinMeeting = () => {
    if (!roomName.trim()) {
      toast.error(t.roomNameRequired || 'Please enter a room name')
      return
    }
    
    setIsCreating(true)
    try {
      const meetingUrl = `/${currentLang}/meet?room=${encodeURIComponent(roomName.trim())}`
      router.push(meetingUrl)
    } catch (error) {
      console.error('Error joining meeting:', error)
      toast.error(dict?.common?.error || 'Failed to join meeting')
    } finally {
      setIsCreating(false)
      setOpen(false)
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25'
      case 'outline':
        return 'border-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30'
      case 'ghost':
        return 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30'
      default:
        return 'bg-purple-600 hover:bg-purple-700 text-white'
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-xs'
      case 'lg':
        return 'h-12 px-6 text-base'
      case 'icon':
        return 'h-10 w-10 p-0'
      default:
        return 'h-10 px-4 text-sm'
    }
  }

  const defaultLabel = label || t.startMeeting

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            getVariantStyles(),
            getSizeStyles(),
            'font-medium transition-all duration-300',
            className
          )}
        >
          {showIcon && <Video className={cn(
            size === 'sm' ? 'h-3.5 w-3.5 mr-1.5' : 
            size === 'lg' ? 'h-5 w-5 mr-2' : 
            'h-4 w-4 mr-2'
          )} />}
          {size !== 'icon' && defaultLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-0 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <Sparkles className="h-6 w-6 text-purple-500" />
            {t.startMeeting}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Instant Meeting */}
          <button
            onClick={handleCreateInstantMeeting}
            disabled={isCreating}
            className="group relative overflow-hidden rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-4 transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-semibold text-slate-900 dark:text-white">
                  {t.instantMeeting}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t.instantDescription}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </div>
          </button>

          {/* Join Existing Meeting */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <Users className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 dark:text-white">
                  {t.joinMeeting}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t.joinDescription}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="room-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.roomName}
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="room-name"
                    placeholder={t.roomNamePlaceholder}
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="flex-1 border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => setRoomName(`meet-${Math.random().toString(36).substring(2, 8)}`)}
                    className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {t.randomRoom}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleJoinMeeting}
                disabled={isCreating || !roomName.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.joining}
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    {t.join}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Recent Meetings - Optional */}
          {/* <div className="pt-2">
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              {t.recentMeetings}
            </h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                Project Discussion - Today 2:30 PM
              </button>
            </div>
          </div> */}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-slate-200 dark:border-slate-700"
          >
            {t.cancel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Compact version for navbar/header
export function MeetButtonCompact({ dict, lang }: { dict?: any; lang?: string }) {
  return (
    <MeetButton
      variant="gradient"
      size="sm"
      showIcon={true}
      label={dict?.meetButton?.startMeeting || 'Meet'}
      dict={dict}
      lang={lang}
    />
  )
}

// Floating action button version
export function MeetButtonFloating({ dict, lang }: { dict?: any; lang?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const currentLang = lang || (params.lang as string) || 'fr'

  const handleStartMeeting = () => {
    const roomId = `meet-${Math.random().toString(36).substring(2, 10)}`
    router.push(`/${currentLang}/meet?room=${roomId}`)
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-50 right-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300"
      >
        <Video className="h-6 w-6 text-white" />
        <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-75 group-hover:opacity-0 transition-opacity" />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-20 right-0 mb-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 min-w-[240px] animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="space-y-3">
            <button
              onClick={handleStartMeeting}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {dict?.meetButton?.instantMeeting || 'Instant Meeting'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {dict?.meetButton?.startNow || 'Start now'}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Hero section button
export function MeetButtonHero({ dict, lang, className }: { dict?: any; lang?: string; className?: string }) {
  return (
    <MeetButton
      variant="gradient"
      size="lg"
      showIcon={true}
      label={dict?.meetButton?.startMeeting || 'Start a Meeting'}
      dict={dict}
      lang={lang}
      className={cn(
        'px-8 py-6 text-lg shadow-2xl shadow-purple-500/30 hover:scale-105 transition-transform',
        className
      )}
    />
  )
}