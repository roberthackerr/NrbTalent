import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const faqCategories = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click the 'Get Started' button in the top right corner, choose whether you're a freelancer or client, and fill out the registration form. You'll receive a confirmation email to verify your account.",
      },
      {
        q: "Is NRBTalents free to use?",
        a: "Yes! Creating an account and browsing talents/projects is completely free. We only charge a small platform fee (10%) on completed projects.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for larger projects.",
      },
    ],
  },
  {
    category: "For Clients",
    questions: [
      {
        q: "How do I post a project?",
        a: "After logging in, go to your dashboard and click 'Post a Project'. Fill in the project details, budget, timeline, and required skills. Your project will be visible to relevant freelancers immediately.",
      },
      {
        q: "How does the AI matching work?",
        a: "Our AI analyzes your project requirements and matches them with freelancers based on skills, experience, availability, past performance, and compatibility score. You'll receive a curated list of the best candidates.",
      },
      {
        q: "What if I'm not satisfied with the work?",
        a: "We have a dispute resolution system. If you're not satisfied, you can request revisions or open a dispute. Our team will mediate to ensure a fair outcome. Funds are held in escrow until you approve the work.",
      },
      {
        q: "Can I hire a team of freelancers?",
        a: "Yes! You can use our Team Mode feature to hire multiple freelancers for different roles in your project. You can manage the entire team from one dashboard.",
      },
    ],
  },
  {
    category: "For Freelancers",
    questions: [
      {
        q: "How do I get verified?",
        a: "Go to Settings > Verification and upload a government-issued ID and proof of address. Our team will review your documents within 24-48 hours. Verified freelancers get a badge and higher visibility.",
      },
      {
        q: "How do I get paid?",
        a: "Once a client approves your work, funds are released from escrow to your NRBTalents account. You can withdraw to your bank account or PayPal. Payments typically arrive within 3-5 business days.",
      },
      {
        q: "Can I create service packages?",
        a: "Yes! You can create Gigs (predefined service packages) with fixed prices and delivery times. This is great for services you offer repeatedly.",
      },
      {
        q: "How do I improve my profile visibility?",
        a: "Complete your profile 100%, get verified, take skill tests, maintain high ratings, respond quickly to messages, and deliver quality work on time. Our AI favors active, high-performing freelancers.",
      },
    ],
  },
  {
    category: "Payments & Fees",
    questions: [
      {
        q: "What are the platform fees?",
        a: "We charge a 10% service fee on completed projects. This covers payment processing, escrow services, dispute resolution, and platform maintenance.",
      },
      {
        q: "How does escrow work?",
        a: "When a client hires you, they deposit the project funds into escrow. The money is held securely until you complete the work and the client approves it. This protects both parties.",
      },
      {
        q: "Can I offer milestone-based payments?",
        a: "Yes! For larger projects, you can break payments into milestones. Each milestone is paid separately as you complete different phases of the project.",
      },
      {
        q: "Are there any withdrawal fees?",
        a: "Bank transfers are free for amounts over $100. PayPal withdrawals have a small processing fee. Check our pricing page for detailed fee information.",
      },
    ],
  },
  {
    category: "Security & Trust",
    questions: [
      {
        q: "How do you verify freelancers?",
        a: "We verify identity documents, check professional credentials, review portfolios, and monitor performance. Freelancers can also take skill tests to prove their expertise.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes! We use Stripe for payment processing, which is PCI DSS compliant. We never store your full credit card information on our servers.",
      },
      {
        q: "What if a freelancer doesn't deliver?",
        a: "Your funds are protected in escrow. If a freelancer doesn't deliver, you can request a refund through our dispute system. We'll investigate and ensure a fair resolution.",
      },
      {
        q: "Can I see reviews before hiring?",
        a: "Yes! Every freelancer has a public profile with ratings, reviews, completed projects, and skill assessments. You can make an informed decision before hiring.",
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              FAQ
            </Badge>
            <h1 className="text-4xl font-bold mb-6 sm:text-5xl">
              Frequently Asked Questions
              <br />
              <span className="gradient-text">We're here to help</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers to common questions about NRBTalents. Can't find what you're looking for? Contact our support
              team.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search for answers..." className="pl-12 h-12 bg-card border-border/50" />
            </div>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqCategories.map((category, idx) => (
              <Card key={idx} className="p-6">
                <h2 className="text-2xl font-bold mb-4">{category.category}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, qIdx) => (
                    <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                      <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ))}
          </div>

          {/* Still need help */}
          <Card className="mt-12 p-8 text-center bg-card/50">
            <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Contact Support
              </a>
              <a
                href="mailto:support@nrbtalents.com"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Email Us
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
