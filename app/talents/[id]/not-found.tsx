import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UserX } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pt-24">
        <Card className="w-full max-w-md p-8 text-center">
          <UserX className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-6 text-2xl font-bold">Freelancer Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The freelancer profile you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="mt-6">
            <Link href="/talents">Browse All Talents</Link>
          </Button>
        </Card>
      </main>
    </div>
  )
}
