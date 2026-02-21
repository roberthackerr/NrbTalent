import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, MessageSquare, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Contact Us
            </Badge>
            <h1 className="text-4xl font-bold mb-6 sm:text-5xl">
              Get in touch
              <br />
              <span className="gradient-text">We're here to help</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Have a question or need assistance? Our team is ready to help you succeed.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Contact Info Cards */}
            <Card className="p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Email Us</h3>
              <p className="text-sm text-muted-foreground mb-3">Our team will respond within 24 hours</p>
              <a href="mailto:support@nrbtalents.com" className="text-primary hover:underline">
                support@nrbtalents.com
              </a>
            </Card>

            <Card className="p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-3">Chat with our support team</p>
              <Button variant="outline" size="sm">
                Start Chat
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Call Us</h3>
              <p className="text-sm text-muted-foreground mb-3">Mon-Fri from 9am to 6pm EST</p>
              <a href="tel:+1234567890" className="text-primary hover:underline">
                +1 (234) 567-890
              </a>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Tell us more about your inquiry..." rows={6} />
                </div>

                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </Card>

            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Office Location</h2>
                <Card className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">NRBTalents Headquarters</p>
                      <p className="text-sm text-muted-foreground">
                        123 Tech Street
                        <br />
                        San Francisco, CA 94105
                        <br />
                        United States
                      </p>
                    </div>
                  </div>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src="/office-map.png"
                      alt="Office location map"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Card>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                <Card className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1">How quickly will I get a response?</h3>
                      <p className="text-sm text-muted-foreground">
                        We typically respond to all inquiries within 24 hours during business days.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Do you offer phone support?</h3>
                      <p className="text-sm text-muted-foreground">
                        Yes, phone support is available Monday through Friday, 9am to 6pm EST.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Can I schedule a demo?</h3>
                      <p className="text-sm text-muted-foreground">
                        Contact us to schedule a personalized demo of the platform.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
