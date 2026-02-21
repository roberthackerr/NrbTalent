"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, DollarSign, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

export default function ApplicationsPage() {
  const applications = {
    pending: [
      {
        id: 1,
        projectTitle: "E-commerce Platform Development",
        proposedBudget: 6500,
        duration: "3 weeks",
        appliedDate: "2 days ago",
        category: "Web Development",
      },
      {
        id: 2,
        projectTitle: "Mobile App UI/UX Design",
        proposedBudget: 2800,
        duration: "2 weeks",
        appliedDate: "5 days ago",
        category: "UI/UX Design",
      },
    ],
    accepted: [
      {
        id: 3,
        projectTitle: "API Integration & Testing",
        proposedBudget: 2000,
        duration: "1 week",
        acceptedDate: "1 week ago",
        category: "Backend Development",
      },
    ],
    rejected: [
      {
        id: 4,
        projectTitle: "Blockchain Smart Contract",
        proposedBudget: 5000,
        duration: "2 weeks",
        rejectedDate: "3 days ago",
        category: "Blockchain",
      },
    ],
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar role="freelance" />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Applications</h1>
            <p className="mt-2 text-muted-foreground">Track the status of all your project applications.</p>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending ({applications.pending.length})
              </TabsTrigger>
              <TabsTrigger value="accepted" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Accepted ({applications.accepted.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({applications.rejected.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {applications.pending.map((app) => (
                <Card key={app.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{app.projectTitle}</h3>
                        <Badge variant="secondary">{app.category}</Badge>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">${app.proposedBudget.toLocaleString()}</span>
                        </div>
                        <span>•</span>
                        <span>Duration: {app.duration}</span>
                        <span>•</span>
                        <span>Applied {app.appliedDate}</span>
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard/freelance/projects/${app.id}`}>View Project</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-4">
              {applications.accepted.map((app) => (
                <Card key={app.id} className="border-primary/20 bg-primary/5 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{app.projectTitle}</h3>
                        <Badge variant="secondary">{app.category}</Badge>
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Accepted
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">${app.proposedBudget.toLocaleString()}</span>
                        </div>
                        <span>•</span>
                        <span>Duration: {app.duration}</span>
                        <span>•</span>
                        <span>Accepted {app.acceptedDate}</span>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/dashboard/freelance/projects/${app.id}`}>Start Working</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {applications.rejected.map((app) => (
                <Card key={app.id} className="p-6 opacity-60">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{app.projectTitle}</h3>
                        <Badge variant="secondary">{app.category}</Badge>
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Rejected
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">${app.proposedBudget.toLocaleString()}</span>
                        </div>
                        <span>•</span>
                        <span>Duration: {app.duration}</span>
                        <span>•</span>
                        <span>Rejected {app.rejectedDate}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
