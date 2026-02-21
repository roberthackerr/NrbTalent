import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"

interface ConnectionStatusProps {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'| 'error'
  reconnectAttempt: number
  onReconnect: () => void
}

export const ConnectionStatus = ({ 
  connectionStatus, 
  reconnectAttempt, 
  onReconnect 
}: ConnectionStatusProps) => {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
          icon: <Wifi className="h-4 w-4" />,
          text: 'Connecté',
          pulse: true
        }
      case 'connecting':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          text: 'Connexion...',
          pulse: false
        }
      case 'reconnecting':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          text: `Reconnexion... (${reconnectAttempt})`,
          pulse: true
        }
      default:
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-500',
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Déconnecté',
          pulse: false
        }
    }
  }

  const status = getStatusConfig()

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white shadow-lg backdrop-blur-sm transition-all duration-300 ${status.bg} ${status.pulse ? 'animate-pulse' : ''}`}>
      {status.icon}
      <span className="font-medium">{status.text}</span>
      
      {!['connected', 'connecting'].includes(connectionStatus) && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 transition-all"
          onClick={onReconnect}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}