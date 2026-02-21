// components/email-verified-badge.tsx
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface EmailVerifiedBadgeProps {
  verified: boolean | Date | null
  email?: string
  className?: string
}

export function EmailVerifiedBadge({ verified, email, className = '' }: EmailVerifiedBadgeProps) {
  const isVerified = !!verified
  
  if (isVerified) {
    const verifiedDate = verified instanceof Date ? verified : null
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 text-green-800 text-sm ${className}`}>
              <CheckCircle className="w-3 h-3" />
              <span>Email vérifié</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {verifiedDate ? (
              <p>Vérifié le {verifiedDate.toLocaleDateString('fr-FR')}</p>
            ) : (
              <p>Email vérifié</p>
            )}
            {email && <p className="text-xs mt-1">{email}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-sm ${className}`}>
            <AlertCircle className="w-3 h-3" />
            <span>Non vérifié</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Votre email n'est pas vérifié</p>
          <p className="text-xs mt-1">Vérifiez votre boîte mail ou <a href="/auth/verify-email" className="underline">renvoyez le lien</a></p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}