// components/auth/AuthIconButtons.tsx
"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"

export const AuthIconButtons = () => {
  const { data: session } = useSession()
  const router = useRouter()

  if (session) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/profile/${session.user?.id}`)}
          className="h-8 w-8 rounded-full"
          title="Mon profil"
        >
          <User className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut()}
          className="h-8 w-8 rounded-full text-red-500 hover:text-red-600"
          title="Déconnexion"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => signIn(undefined, { callbackUrl: "/messages" })}
      className="h-8 w-8 rounded-full"
      title="Se connecter"
    >
      <LogIn className="h-4 w-4" />
    </Button>
  )
}