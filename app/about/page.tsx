import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Target, Award, Heart, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              About NRBTalents
            </Badge>
            <h1 className="text-4xl font-bold mb-6 sm:text-5xl">
              Connecting the world's best tech talent
              <br />
              <span className="gradient-text">with innovative companies</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We're on a mission to democratize access to elite tech talent and empower freelancers to build successful
              careers on their own terms.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">2,500+</div>
              <div className="text-muted-foreground">Verified Freelancers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-muted-foreground">Projects Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-muted-foreground">Client Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-muted-foreground">Countries</div>
            </div>
          </div>

          {/* Values */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Community First</h3>
                <p className="text-sm text-muted-foreground">
                  We build for our community of freelancers and clients, always putting their needs first.
                </p>
              </Card>
              <Card className="p-6 text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Excellence</h3>
                <p className="text-sm text-muted-foreground">
                  We maintain the highest standards of quality in everything we do.
                </p>
              </Card>
              <Card className="p-6 text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Innovation</h3>
                <p className="text-sm text-muted-foreground">
                  We leverage cutting-edge technology to create the best experience.
                </p>
              </Card>
              <Card className="p-6 text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Trust</h3>
                <p className="text-sm text-muted-foreground">
                  We build trust through transparency, security, and reliability.
                </p>
              </Card>
            </div>
          </div>

          {/* Story */}
          <div className="mb-20">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  NRBTalents was founded in 2024 with a simple yet powerful vision: to create a platform where
                  exceptional tech talent could connect with innovative companies seamlessly.
                </p>
                <p>
                  We noticed that traditional freelance platforms were either too generic or too complicated. Companies
                  struggled to find qualified tech professionals, and talented freelancers had difficulty showcasing
                  their specialized skills.
                </p>
                <p>
                  That's why we built NRBTalents - a platform specifically designed for the tech industry, powered by AI
                  matching technology, and focused on creating meaningful, long-term relationships between freelancers
                  and clients.
                </p>
                <p>
                  Today, we're proud to serve thousands of freelancers and companies across 50+ countries, facilitating
                  millions of dollars in projects and helping build the future of work.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-card/50 rounded-2xl p-12 border border-border/50">
            <h2 className="text-3xl font-bold mb-4">Join our community</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whether you're looking to hire top talent or showcase your skills, NRBTalents is the place for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
