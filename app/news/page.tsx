import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Shield, Zap, Users, Star, CheckCircle2, Quote } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        {/* Background gradient effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 gap-1 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Powered by AI Matching Technology</span>
            </Badge>

            <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              The complete platform
              <br />
              <span className="gradient-text">to build with talent.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Connect with elite tech freelancers specializing in development, AI, cybersecurity, and
              telecommunications. Build transformative projects with verified professionals.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="h-12 gap-2 bg-primary px-8 text-base hover:bg-primary/90">
                <Link href="/auth/signup">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base bg-transparent">
                <Link href="/talents">Browse Talents</Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required • Free to start • 2,500+ verified professionals
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border/40 bg-card/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold">2,500+</div>
              <div className="mt-2 text-sm text-muted-foreground">Verified Freelancers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">98%</div>
              <div className="mt-2 text-sm text-muted-foreground">Client Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">5,000+</div>
              <div className="mt-2 text-sm text-muted-foreground">Projects Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">24/7</div>
              <div className="mt-2 text-sm text-muted-foreground">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Freelancers Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Top Talent
            </Badge>
            <h2 className="text-balance text-3xl font-bold sm:text-4xl lg:text-5xl">Featured Freelancers</h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
              Work with verified professionals who deliver exceptional results
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Alex Rivera",
                title: "Full-Stack Developer",
                rating: 5.0,
                reviews: 127,
                hourlyRate: 85,
                skills: ["React", "Node.js", "AWS"],
                image: "/developer-working.png",
              },
              {
                name: "Sarah Chen",
                title: "AI/ML Engineer",
                rating: 4.9,
                reviews: 89,
                hourlyRate: 120,
                skills: ["Python", "TensorFlow", "PyTorch"],
                image: "/ai-engineer.jpg",
              },
              {
                name: "Marcus Johnson",
                title: "Cybersecurity Expert",
                rating: 5.0,
                reviews: 156,
                hourlyRate: 95,
                skills: ["Penetration Testing", "OWASP", "Security Audit"],
                image: "/security-expert.png",
              },
              {
                name: "Emily Park",
                title: "Telecom Specialist",
                rating: 4.8,
                reviews: 73,
                hourlyRate: 110,
                skills: ["5G", "Network Design", "IoT"],
                image: "/telecom-engineer.jpg",
              },
            ].map((freelancer, index) => (
              <Card key={index} className="overflow-hidden hover:border-primary/50 transition-all group">
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                  <img
                    src={freelancer.image || "/placeholder.svg"}
                    alt={freelancer.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-3 right-3 bg-background/90 backdrop-blur">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {freelancer.rating}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{freelancer.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{freelancer.title}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {freelancer.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground">Starting at</span>
                      <p className="font-bold">${freelancer.hourlyRate}/hr</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/talents/${index}`}>View Profile</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" asChild className="bg-transparent">
              <Link href="/talents">
                View All Talents
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              Features
            </Badge>
            <h2 className="text-balance text-3xl font-bold sm:text-4xl lg:text-5xl">Everything you need to succeed</h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
              Powerful tools and features designed to make collaboration seamless and secure.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="group relative overflow-hidden border-border/50 bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI-Powered Matching</h3>
              <p className="text-pretty text-muted-foreground">
                Our intelligent algorithm finds the perfect freelancer for your project based on skills, experience, and
                availability.
              </p>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Secure Payments</h3>
              <p className="text-pretty text-muted-foreground">
                Escrow system ensures your funds are protected. Payment is released only when you're satisfied with the
                work.
              </p>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Fast Hiring</h3>
              <p className="text-pretty text-muted-foreground">
                Post your project and receive qualified applications within hours. Start working in less than 24 hours.
              </p>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Team Collaboration</h3>
              <p className="text-pretty text-muted-foreground">
                Built-in messaging, file sharing, and project management tools keep everyone aligned and productive.
              </p>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Quality Assurance</h3>
              <p className="text-pretty text-muted-foreground">
                All freelancers are verified and rated. Review portfolios, ratings, and past work before hiring.
              </p>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 bg-card p-8 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">24/7 Support</h3>
              <p className="text-pretty text-muted-foreground">
                Our dedicated support team is always available to help you resolve any issues quickly.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="text-balance text-3xl font-bold sm:text-4xl lg:text-5xl">
              Loved by clients and freelancers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
              See what our community has to say about their experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "NRBTalents helped me find the perfect developer for my SaaS project. The AI matching was spot-on, and the collaboration tools made everything seamless.",
                author: "David Miller",
                role: "CEO, TechStart Inc",
                rating: 5,
              },
              {
                quote:
                  "As a freelancer, this platform has been a game-changer. I've landed multiple high-quality projects and the payment system is incredibly secure and fast.",
                author: "Lisa Wang",
                role: "Full-Stack Developer",
                rating: 5,
              },
              {
                quote:
                  "The quality of talent on NRBTalents is exceptional. We've built our entire development team through this platform and couldn't be happier.",
                author: "James Brown",
                role: "CTO, FinanceFlow",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="p-6 relative">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">{testimonial.quote}</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40 bg-card/50 py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-3xl font-bold sm:text-4xl lg:text-5xl">Ready to build something amazing?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            Join thousands of companies and freelancers who trust NRBTalents for their projects.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="h-12 gap-2 bg-primary px-8 text-base hover:bg-primary/90">
              <Link href="/auth/signup">
                Start Your Project
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base bg-transparent">
              <Link href="/how-it-works">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="NRBTalents" width={32} height={32} className="h-8 w-8" />
                <span className="text-xl font-bold">NRBTalents</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Where true talent meets innovation.</p>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/talents" className="hover:text-foreground">
                    Find Talents
                  </Link>
                </li>
                <li>
                  <Link href="/services" className="hover:text-foreground">
                    Browse Services
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-foreground">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-foreground">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-foreground">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 NRBTalents. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
