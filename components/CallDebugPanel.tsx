// Ajouter ce composant temporaire en haut de votre page (pour debug)
// À SUPPRIMER une fois le problème résolu

import { useState } from "react"

export const CallDebugPanel = ({ 
  isVideoCallOpen, 
  callStatus, 
  videoCallChannel, 
  showOutgoingCall, 
  showIncomingCall,
  isCallLoading,
  remoteUsers,
  incomingCallData,
  outgoingCallData
}: any) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <div className="fixed bottom-4 right-4 z-[10000] bg-black/90 text-white p-4 rounded-lg shadow-2xl max-w-md text-xs font-mono">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left font-bold mb-2 flex justify-between items-center"
      >
        <span>🐛 Call Debug Panel</span>
        <span>{isExpanded ? '▼' : '▲'}</span>
      </button>
      
      {isExpanded && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-gray-400">Modal Open:</div>
              <div className={isVideoCallOpen ? "text-green-400" : "text-red-400"}>
                {isVideoCallOpen ? "✅ YES" : "❌ NO"}
              </div>
            </div>
            
            <div>
              <div className="text-gray-400">Call Status:</div>
              <div className={
                callStatus === "connected" ? "text-green-400" : 
                callStatus === "connecting" ? "text-yellow-400" : 
                "text-gray-400"
              }>
                {callStatus.toUpperCase()}
              </div>
            </div>
            
            <div>
              <div className="text-gray-400">Outgoing Call:</div>
              <div className={showOutgoingCall ? "text-yellow-400" : "text-gray-400"}>
                {showOutgoingCall ? "📞 RINGING" : "—"}
              </div>
            </div>
            
            <div>
              <div className="text-gray-400">Incoming Call:</div>
              <div className={showIncomingCall ? "text-green-400" : "text-gray-400"}>
                {showIncomingCall ? "📲 RINGING" : "—"}
              </div>
            </div>
            
            <div>
              <div className="text-gray-400">Loading:</div>
              <div className={isCallLoading ? "text-yellow-400" : "text-gray-400"}>
                {isCallLoading ? "⏳ YES" : "NO"}
              </div>
            </div>
            
            <div>
              <div className="text-gray-400">Remote Users:</div>
              <div className={remoteUsers.length > 0 ? "text-green-400" : "text-gray-400"}>
                {remoteUsers.length} user(s)
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="text-gray-400 mb-1">Channel:</div>
            <div className="text-blue-400 break-all">
              {videoCallChannel || "—"}
            </div>
          </div>
          
          {incomingCallData && (
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="text-gray-400 mb-1">Incoming Data:</div>
              <div className="text-green-400">
                From: {incomingCallData.callerName}<br/>
                Channel: {incomingCallData.channelName?.substring(0, 20)}...
              </div>
            </div>
          )}
          
          {outgoingCallData && (
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="text-gray-400 mb-1">Outgoing Data:</div>
              <div className="text-yellow-400">
                To: {outgoingCallData.recipientName}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Utilisation dans votre page:
// Ajouter juste avant le dernier </div> de votre composant principal:

