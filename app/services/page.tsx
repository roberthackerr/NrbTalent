import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Star, Search, Code, Brain, Shield, Radio, Palette, TrendingUp } from "lucide-react"
import Link from "next/link"

const categories = [
  { name: "Development", icon: Code, count: 1250, color: "text-blue-500" },
  { name: "AI & ML", icon: Brain, count: 680, color: "text-purple-500" },
  { name: "Cybersecurity", icon: Shield, count: 420, color: "text-red-500" },
  { name: "Telecom", icon: Radio, count: 310, color: "text-green-500" },
  { name: "Design", icon: Palette, count: 890, color: "text-pink-500" },
  { name: "Marketing", icon: TrendingUp, count: 560, color: "text-orange-500" },
]

const featuredGigs = [
  {
    id: 1,
    title: "I will develop a full-stack web application with React and Node.js",
    freelancer: "John Doe",
    rating: 4.9,
    reviews: 127,
    price: 500,
    image: "/web-development-concept.png",
    deliveryTime: "7 days",
  },
  {
    id: 2,
    title: "I will build an AI chatbot using GPT-4 and custom training",
    freelancer: "Sarah Smith",
    rating: 5.0,
    reviews: 89,
    price: 800,
    image: "/ai-chatbot.png",
    deliveryTime: "5 days",
  },
  {
    id: 3,
    title: "I will perform a comprehensive security audit for your application",
    freelancer: "Mike Johnson",
    rating: 4.8,
    reviews: 156,
    price: 600,
    image: "/security-audit.png",
    deliveryTime: "3 days",
  },
  {
    id: 4,
    title: "I will design and implement a 5G network solution",
    freelancer: "Emily Chen",
    rating: 4.9,
    reviews: 73,
    price: 1200,
    image: "/5g-network.png",
    deliveryTime: "10 days",
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-24 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Browse Services</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Find the perfect service for your project from our talented freelancers
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search for services..." className="pl-12 h-14 text-base bg-card border-border/50" />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link key={category.name} href={`/services?category=${category.name.toLowerCase()}`}>
                  <Card className="p-6 text-center hover:border-primary/50 transition-all cursor-pointer group">
                    <category.icon
                      className={`h-8 w-8 mx-auto mb-3 ${category.color} group-hover:scale-110 transition-transform`}
                    />
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} services</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Featured Services */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Featured Services</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredGigs.map((gig) => (
                <Link key={gig.id} href={`/services/${gig.id}`}>
                  <Card className="overflow-hidden hover:border-primary/50 transition-all group cursor-pointer">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={gig.image || "/placeholder.svg"}
                        alt={gig.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold">{gig.freelancer[0]}</span>
                        </div>
                        <span className="text-sm font-medium">{gig.freelancer}</span>
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {gig.title}
                      </h3>
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">{gig.rating}</span>
                        <span className="text-sm text-muted-foreground">({gig.reviews})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground">Starting at</span>
                          <p className="font-bold text-lg">${gig.price}</p>
                        </div>
                        <Badge variant="secondary">{gig.deliveryTime}</Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
