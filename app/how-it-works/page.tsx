import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, FileText, MessageSquare, CheckCircle2, Star, Shield, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-24 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              How It Works
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your journey to success
              <br />
              <span className="gradient-text">starts here</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're hiring talent or offering your services, NRBTalents makes it simple, secure, and efficient.
            </p>
          </div>

          {/* For Clients */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">For Clients</h2>
              <p className="text-muted-foreground">Find and hire the perfect freelancer in 4 simple steps</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 relative">
                <div className="absolute -top-3 -left-3 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  1
                </div>
                <FileText className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Post Your Project</h3>
                <p className="text-muted-foreground">
                  Describe your project requirements, budget, and timeline. Our AI will help match you with the right
                  talent.
                </p>
              </Card>

              <Card className="p-6 relative">
                <div className="absolute -top-3 -left-3 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  2
                </div>
                <Search className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Review Proposals</h3>
                <p className="text-muted-foreground">
                  Receive proposals from qualified freelancers. Review their profiles, portfolios, and ratings.
                </p>
              </Card>

              <Card className="p-6 relative">
                <div className="absolute -top-3 -left-3 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  3
                </div>
                <MessageSquare className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Collaborate</h3>
                <p className="text-muted-foreground">
                  Use our built-in workspace to communicate, share files, and track progress in real-time.
                </p>
              </Card>

              <Card className="p-6 relative">
                <div className="absolute -top-3 -left-3 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  4
                </div>
                <CheckCircle2 className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Pay Securely</h3>
                <p className="text-muted-foreground">
                  Release payment through our secure escrow system only when you're satisfied with the work.
                </p>
              </Card>
            </div>
          </div>

          {/* For Freelancers */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">For Freelancers</h2>
              <p className="text-muted-foreground">Start earning with your skills in 4 simple steps</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 relative">
                <div className="absolute -top-3 -left-3 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  1
                </div>
                <UserPlus className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
                <p className="text-muted-foreground">
                  Showcase your skills, experience, and portfolio. Get verified to stand out from the crowd.
                </p>
              </Card>

              <Card className="p-6 relative">
                <div className="absolute -top-3 -left-3 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  2
                </div>
                <Search className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Find Projects</h3>
                <p className="text-muted-foreground">
                  Browse projects that match your skills or create service offerings for clients to discover.
                </p>
              </Card>

              <Card className="p-6 relative">
                <div className="absolute -top-3 -left-3 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  3
                </div>
                <FileText className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Submit Proposals</h3>
                <p className="text-muted-foreground">
                  Write compelling proposals that highlight your expertise and how you'll deliver value.
                </p>
              </Card>

              <Card className="p-6 relative">
                <div className="absolute -top-3 -left-3 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  4
                </div>
                <Star className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Deliver & Earn</h3>
                <p className="text-muted-foreground">
                  Complete projects, build your reputation, and get paid securely through our platform.
                </p>
              </Card>
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">Why Choose NRBTalents?</h2>
              <p className="text-muted-foreground">The platform built for success</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Secure & Protected</h3>
                <p className="text-muted-foreground">
                  Escrow payments, verified profiles, and 24/7 support ensure your projects and payments are always
                  safe.
                </p>
              </Card>

              <Card className="p-8 text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI-Powered Matching</h3>
                <p className="text-muted-foreground">
                  Our intelligent algorithm connects you with the perfect match based on skills, experience, and
                  compatibility.
                </p>
              </Card>

              <Card className="p-8 text-center">
                <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Quality Guaranteed</h3>
                <p className="text-muted-foreground">
                  All freelancers are vetted and rated. Only work with verified professionals who deliver excellence.
                </p>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Card className="p-12 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of clients and freelancers who trust NRBTalents for their projects.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="h-12 px-8">
                  <Link href="/auth/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-8 bg-transparent">
                  <Link href="/services">Browse Services</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
