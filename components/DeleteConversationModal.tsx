import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react"
import { Conversation } from "@/types/chat"

interface DeleteConversationModalProps {
  isOpen: boolean
  onClose: () => void
  conversation: Conversation | null
  onDelete: (id: string) => void
  isDeleting: boolean
  session: any
}

export const DeleteConversationModal = ({
  isOpen,
  onClose,
  conversation,
  onDelete,
  isDeleting,
  session
}: DeleteConversationModalProps) => {
  if (!isOpen || !conversation) return null

  const otherUser = conversation.participants.find(p => p._id !== (session?.user as any)?.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Supprimer la conversation
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Cette action est irréversible
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Êtes-vous sûr de vouloir supprimer la conversation avec{" "}
            <strong className="text-gray-900 dark:text-white">
              {otherUser?.name || "l'utilisateur"}
            </strong> ?
          </p>
          
          {conversation.lastMessage && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dernier message :</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                "{conversation.lastMessage}"
              </p>
            </div>
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Tous les messages seront définitivement supprimés et ne pourront pas être récupérés.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-11 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={onClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            className="flex-1 rounded-xl h-11 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg transition-all duration-200"
            onClick={() => onDelete(conversation._id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}