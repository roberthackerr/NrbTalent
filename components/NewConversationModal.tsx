import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Search, Users, RefreshCw } from "lucide-react"
import { User } from "@/types/chat"

interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  searchResults: User[]
  isSearching: boolean
  onUserClick: (user: User) => void
}

export const NewConversationModal = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  onUserClick
}: NewConversationModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nouvelle conversation
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des utilisateurs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <ScrollArea className="max-h-96">
          <div className="p-4">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">Recherche en cours...</span>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => onUserClick(user)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
                  >
                    <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 group-hover:scale-105 transition-transform">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {user.name}
                        </h4>
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700">
                          Nouveau
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {user.email}
                      </p>
                      {user.title && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {user.title}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun utilisateur trouvé</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Vérifiez l'orthographe ou essayez d'autres termes
                </p>
              </div>
            )}

            {!isSearching && !searchQuery && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Recherchez des utilisateurs</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Commencez à taper pour trouver des personnes
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            className="w-full rounded-xl h-11 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  )
}