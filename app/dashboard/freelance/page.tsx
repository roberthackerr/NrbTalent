import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, DollarSign, Star, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function FreelanceDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== "freelance") {
    redirect("/auth/signin")
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar role="freelance" />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
            <p className="mt-2 text-muted-foreground">Here's what's happening with your freelance work today.</p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Active Projects" value={3} icon={Briefcase} trend={{ value: 12, isPositive: true }} />
            <StatsCard
              title="Total Earnings"
              value="$12,450"
              icon={DollarSign}
              trend={{ value: 8, isPositive: true }}
            />
            <StatsCard title="Average Rating" value="4.9" description="Based on 47 reviews" icon={Star} />
            <StatsCard
              title="Profile Views"
              value={234}
              description="This month"
              icon={TrendingUp}
              trend={{ value: 23, isPositive: true }}
            />
          </div>

          {/* Recent Projects */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Recent Project Opportunities</h2>
              <Button variant="ghost" asChild>
                <Link href="/dashboard/freelance/projects">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Full-Stack Developer for SaaS Platform",
                  budget: "$5,000 - $8,000",
                  skills: ["React", "Node.js", "PostgreSQL"],
                  posted: "2 hours ago",
                  proposals: 12,
                },
                {
                  title: "AI/ML Engineer for Recommendation System",
                  budget: "$10,000 - $15,000",
                  skills: ["Python", "TensorFlow", "AWS"],
                  posted: "5 hours ago",
                  proposals: 8,
                },
                {
                  title: "Cybersecurity Audit for E-commerce Platform",
                  budget: "$3,000 - $5,000",
                  skills: ["Security", "Penetration Testing", "OWASP"],
                  posted: "1 day ago",
                  proposals: 15,
                },
              ].map((project, index) => (
                <Card key={index} className="p-6 transition-all hover:border-primary/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{project.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Budget: <span className="font-medium text-foreground">{project.budget}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Posted {project.posted}</span>
                        <span>•</span>
                        <span>{project.proposals} proposals</span>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/dashboard/freelance/projects/${index}`}>Apply Now</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Active Applications */}
          <div>
            <h2 className="mb-4 text-2xl font-bold">Your Active Applications</h2>
            <div className="space-y-4">
              {[
                {
                  title: "Mobile App Development for Fitness Startup",
                  status: "Under Review",
                  appliedDate: "2 days ago",
                  proposedRate: "$6,500",
                },
                {
                  title: "Backend API Development for Fintech",
                  status: "Shortlisted",
                  appliedDate: "4 days ago",
                  proposedRate: "$8,000",
                },
              ].map((application, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{application.title}</h3>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Applied {application.appliedDate}</span>
                        <span>•</span>
                        <span>Proposed: {application.proposedRate}</span>
                      </div>
                    </div>
                    <Badge variant={application.status === "Shortlisted" ? "default" : "secondary"}>
                      {application.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
