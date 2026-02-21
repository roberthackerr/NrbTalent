import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Star, Clock, RefreshCw, CheckCircle2, MessageSquare, Heart } from "lucide-react"
import Link from "next/link"

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  // Mock data - replace with actual API call
  const service = {
    id: params.id,
    title: "I will develop a full-stack web application with React and Node.js",
    description:
      "I will create a professional, responsive, and scalable full-stack web application using the latest technologies. With over 5 years of experience in web development, I specialize in building modern applications that are fast, secure, and user-friendly.",
    freelancer: {
      name: "John Doe",
      avatar: "/placeholder.svg",
      rating: 4.9,
      reviews: 127,
      level: "Top Rated",
      responseTime: "1 hour",
    },
    price: 500,
    deliveryTime: "7 days",
    revisions: 3,
    features: [
      "Responsive design for all devices",
      "RESTful API development",
      "Database integration (MongoDB/PostgreSQL)",
      "User authentication & authorization",
      "Admin dashboard",
      "Deployment & hosting setup",
    ],
    packages: [
      {
        name: "Basic",
        price: 500,
        delivery: "7 days",
        revisions: 2,
        features: ["5 pages", "Responsive design", "Basic features", "1 revision"],
      },
      {
        name: "Standard",
        price: 1000,
        delivery: "14 days",
        revisions: 3,
        features: ["10 pages", "Responsive design", "Advanced features", "Database integration", "3 revisions"],
      },
      {
        name: "Premium",
        price: 2000,
        delivery: "21 days",
        revisions: 5,
        features: [
          "Unlimited pages",
          "Responsive design",
          "All features",
          "Database integration",
          "Admin panel",
          "Deployment",
          "5 revisions",
        ],
      },
    ],
    reviews: [
      {
        author: "Sarah M.",
        rating: 5,
        date: "2 weeks ago",
        comment:
          "Excellent work! John delivered exactly what I needed and was very responsive throughout the project. Highly recommended!",
      },
      {
        author: "Mike R.",
        rating: 5,
        date: "1 month ago",
        comment: "Great developer, clean code, and delivered on time. Will definitely work with him again.",
      },
    ],
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Service Header */}
              <div>
                <h1 className="text-3xl font-bold mb-4">{service.title}</h1>
                <div className="flex items-center gap-4 mb-6">
                  <Link href={`/talents/${service.id}`} className="flex items-center gap-3 hover:opacity-80">
                    <Avatar>
                      <AvatarImage src={service.freelancer.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{service.freelancer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{service.freelancer.name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {service.freelancer.level}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          {service.freelancer.rating} ({service.freelancer.reviews})
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Service Image */}
                <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-6">
                  <img src="/web-development-concept.png" alt={service.title} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* About This Gig */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">About This Gig</h2>
                <p className="text-muted-foreground leading-relaxed">{service.description}</p>
              </Card>

              {/* What's Included */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">What's Included</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Reviews */}
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Reviews ({service.freelancer.reviews})</h2>
                <div className="space-y-6">
                  {service.reviews.map((review, idx) => (
                    <div key={idx}>
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{review.author[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{review.author}</span>
                            <span className="text-sm text-muted-foreground">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <p className="text-muted-foreground">{review.comment}</p>
                        </div>
                      </div>
                      {idx < service.reviews.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Packages */}
              <Card className="p-6 sticky top-24">
                <div className="space-y-4">
                  {service.packages.map((pkg, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 ${idx === 1 ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold">{pkg.name}</h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${pkg.price}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {pkg.delivery}
                        </div>
                        <div className="flex items-center gap-1">
                          <RefreshCw className="h-4 w-4" />
                          {pkg.revisions} revisions
                        </div>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {pkg.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full" variant={idx === 1 ? "default" : "outline"}>
                        Select {pkg.name}
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <MessageSquare className="h-4 w-4" />
                    Contact Seller
                  </Button>
                  <Button variant="ghost" className="w-full gap-2">
                    <Heart className="h-4 w-4" />
                    Save to Favorites
                  </Button>
                </div>
              </Card>

              {/* Seller Info */}
              <Card className="p-6">
                <h3 className="font-bold mb-4">About the Seller</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response time</span>
                    <span className="font-medium">{service.freelancer.responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recent delivery</span>
                    <span className="font-medium">24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orders completed</span>
                    <span className="font-medium">127</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
