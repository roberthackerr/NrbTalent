import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for getting started",
      features: [
        "Browse unlimited projects",
        "Apply to 5 projects/month",
        "Basic profile",
        "Community support",
        "10% platform fee",
      ],
    },
    {
      name: "Pro",
      price: "$29",
      description: "For serious freelancers",
      features: [
        "Everything in Free",
        "Unlimited applications",
        "Featured profile",
        "Priority support",
        "5% platform fee",
        "Advanced analytics",
        "Verified badge",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams and agencies",
      features: [
        "Everything in Pro",
        "Team management",
        "Custom contracts",
        "Dedicated account manager",
        "3% platform fee",
        "White-label options",
        "API access",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Simple, transparent pricing</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Choose the plan that works best for you. All plans include access to our platform and community.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg shadow-primary/20" : ""}>
                {plan.popular && (
                  <div className="rounded-t-lg bg-primary px-4 py-1 text-center text-sm font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-6 w-full" variant={plan.popular ? "default" : "outline"} asChild>
                    <Link href="/auth/signup">{plan.price === "Custom" ? "Contact Sales" : "Get Started"}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 rounded-lg border border-border bg-card p-8 text-center">
            <h2 className="text-2xl font-bold">For Clients</h2>
            <p className="mt-2 text-muted-foreground">Post projects for free. Only pay when you hire a freelancer.</p>
            <Button className="mt-4" asChild>
              <Link href="/auth/signup">Post a Project</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
