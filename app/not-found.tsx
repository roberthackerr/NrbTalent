import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent">
            404
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-primary to-cyan-400 mx-auto mt-4 rounded-full" />
        </div>

        <h2 className="text-3xl font-bold mb-4 text-balance">Page introuvable</h2>
        <p className="text-muted-foreground text-lg mb-8 text-pretty">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée. Retournez à l'accueil ou explorez nos
          talents.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent">
            <Link href="/talents">
              <Search className="h-4 w-4" />
              Explorer les talents
            </Link>
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Liens utiles</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/services" className="text-primary hover:underline">
              Services
            </Link>
            <Link href="/how-it-works" className="text-primary hover:underline">
              Comment ça marche
            </Link>
            <Link href="/faq" className="text-primary hover:underline">
              FAQ
            </Link>
            <Link href="/contact" className="text-primary hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
