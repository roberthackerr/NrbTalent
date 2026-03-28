// components/ConnectionStatus.tsx - VERSION CORRIGÉE ET OPTIMISÉE
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConnectionStatusProps {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  reconnectAttempt: number
  onReconnect: () => void
}

export const ConnectionStatus = ({ 
  connectionStatus, 
  reconnectAttempt, 
  onReconnect 
}: ConnectionStatusProps) => {
  // Ne pas afficher le statut quand connecté pour ne pas encombrer l'interface
  if (connectionStatus === 'connected') {
    return null
  }

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          bg: 'bg-blue-500',
          icon: <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />,
          text: 'Connexion...',
          textColor: 'text-white',
          showReconnectButton: false
        }
      case 'reconnecting':
        return {
          bg: 'bg-amber-500',
          icon: <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />,
          text: `Reconnexion (${reconnectAttempt}/5)`,
          textColor: 'text-white',
          showReconnectButton: true
        }
      case 'error':
        return {
          bg: 'bg-red-500',
          icon: <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
          text: 'Erreur de connexion',
          textColor: 'text-white',
          showReconnectButton: true
        }
      default: // disconnected
        return {
          bg: 'bg-red-500',
          icon: <WifiOff className="h-3 w-3 sm:h-3.5 sm:w-3.5" />,
          text: 'Déconnecté',
          textColor: 'text-white',
          showReconnectButton: true
        }
    }
  }

  const status = getStatusConfig()

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 sm:top-4 sm:left-auto sm:right-4 sm:translate-x-0">
      <div className={cn(
        "flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300",
        status.bg,
        "bg-opacity-95 backdrop-blur-sm border border-white/20"
      )}>
        {status.icon}
        <span className={cn("font-medium", status.textColor)}>
          {status.text}
        </span>
        
        {status.showReconnectButton && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 sm:h-6 px-1.5 sm:px-2 ml-0.5 sm:ml-1 text-[10px] sm:text-xs bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
            onClick={onReconnect}
          >
            <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
            <span className="hidden sm:inline">Reconnecter</span>
            <span className="sm:hidden">Réessayer</span>
          </Button>
        )}
      </div>
    </div>
  )
}