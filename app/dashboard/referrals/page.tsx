import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, DollarSign, Mail, Copy, CheckCircle2 } from "lucide-react"

export default function ReferralsPage() {
  const referralCode = "NRBTAL-JD2025"
  const referralLink = `https://nrbtalents.com/signup?ref=${referralCode}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Refer & Earn</h1>
        <p className="text-muted-foreground">
          Invite friends to join NRBTalents and earn $50 for each successful referral!
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">5</div>
              <div className="text-sm text-muted-foreground">Total Referrals</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">$150</div>
              <div className="text-sm text-muted-foreground">Total Earned</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Your Referral Link</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="referralLink">Share this link</Label>
            <div className="flex gap-2 mt-2">
              <Input id="referralLink" value={referralLink} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="referralCode">Or use code</Label>
            <div className="flex gap-2 mt-2">
              <Input id="referralCode" value={referralCode} readOnly className="font-mono text-sm font-bold" />
              <Button variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Invite by Email */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Invite by Email</h2>
        <form className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="friend@example.com" className="mt-2" />
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            <Mail className="mr-2 h-4 w-4" />
            Send Invitation
          </Button>
        </form>
      </Card>

      {/* How it Works */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Share your link</h3>
              <p className="text-sm text-muted-foreground">
                Send your unique referral link to friends via email, social media, or messaging apps.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">They sign up</h3>
              <p className="text-sm text-muted-foreground">
                Your friend creates an account using your referral link and completes their profile.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">You both earn</h3>
              <p className="text-sm text-muted-foreground">
                Once they complete their first project, you earn $50 and they get a $25 bonus!
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Referral History */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Referral History</h2>
        <div className="space-y-3">
          {[
            { email: "sarah@example.com", status: "completed", date: "2025-01-10", reward: 50 },
            { email: "mike@example.com", status: "completed", date: "2025-01-05", reward: 50 },
            { email: "john@example.com", status: "pending", date: "2025-01-15", reward: 0 },
            { email: "emily@example.com", status: "completed", date: "2024-12-28", reward: 50 },
            { email: "david@example.com", status: "pending", date: "2025-01-18", reward: 0 },
          ].map((referral, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{referral.email}</div>
                  <div className="text-sm text-muted-foreground">{referral.date}</div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={referral.status === "completed" ? "default" : "secondary"}>{referral.status}</Badge>
                {referral.status === "completed" && (
                  <div className="text-sm font-bold text-green-500 mt-1">+${referral.reward}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
