"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Star, DollarSign, Clock, CheckCircle2, X } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Link from "next/link"
import type { Project } from "@/lib/models/user"

export default function ProposalsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProject()
  }, [params.id])

  async function fetchProject() {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      }
    } catch (error) {
      console.error("Error fetching project:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApplicationAction(applicationId: string, status: "accepted" | "rejected") {
    try {
      const response = await fetch(`/api/applications/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      })

      if (response.ok) {
        toast.success(`Application ${status}!`)
        fetchProject()
      } else {
        toast.error("Failed to update application")
      }
    } catch (error) {
      toast.error("Something went wrong")
    }
  }

  if (loading || !project) {
    return (
      <div className="flex h-screen">
        <DashboardSidebar role="client" />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading proposals...</p>
        </main>
      </div>
    )
  }

  const applications = project.applications || []
  const pendingApps = applications.filter((app: any) => app.status === "pending")
  const acceptedApps = applications.filter((app: any) => app.status === "accepted")
  const rejectedApps = applications.filter((app: any) => app.status === "rejected")

  return (
    <div className="flex h-screen">
      <DashboardSidebar role="client" />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8">
          <Button variant="ghost" asChild className="mb-6 gap-2">
            <Link href="/dashboard/client/projects">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <p className="mt-2 text-muted-foreground">Review and manage applications for this project.</p>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">Pending ({pendingApps.length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({acceptedApps.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedApps.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingApps.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No pending applications yet.</p>
                </Card>
              ) : (
                pendingApps.map((app: any) => (
                  <Card key={app._id?.toString()} className="p-6">
                    <div className="flex items-start gap-6">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback>F</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">Freelancer Name</h3>
                            <div className="mt-1 flex items-center gap-2 text-sm">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">4.9</span>
                              </div>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">32 reviews</span>
                            </div>
                          </div>
                          <Badge variant="secondary">Pending</Badge>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div className="rounded-lg border border-border/40 p-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              <span>Proposed Budget</span>
                            </div>
                            <p className="mt-1 font-semibold">${app.proposedBudget?.toLocaleString()}</p>
                          </div>
                          <div className="rounded-lg border border-border/40 p-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Estimated Duration</span>
                            </div>
                            <p className="mt-1 font-semibold">{app.estimatedDuration}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h4 className="mb-2 font-medium">Cover Letter</h4>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{app.coverLetter}</p>
                        </div>

                        <div className="mt-6 flex gap-3">
                          <Button
                            onClick={() => handleApplicationAction(app._id.toString(), "accepted")}
                            className="gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleApplicationAction(app._id.toString(), "rejected")}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button variant="ghost">View Profile</Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-4">
              {acceptedApps.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No accepted applications yet.</p>
                </Card>
              ) : (
                acceptedApps.map((app: any) => (
                  <Card key={app._id?.toString()} className="p-6">
                    <div className="flex items-start gap-6">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback>F</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">Freelancer Name</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Budget: ${app.proposedBudget?.toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Accepted
                          </Badge>
                        </div>

                        <div className="mt-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm text-gray-400">Payment Status</p>
                              <p className="font-semibold text-white">
                                {app.paymentStatus === "paid" ? "Paid" : "Pending Payment"}
                              </p>
                            </div>
                            {app.paymentStatus !== "paid" && (
                              <Button
                                asChild
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                              >
                                <Link href={`/dashboard/client/projects/${app._id}/payment`}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Pay Now
                                </Link>
                              </Button>
                            )}
                          </div>
                          {app.paymentStatus === "paid" && app.paidAt && (
                            <p className="text-xs text-gray-400">Paid on {new Date(app.paidAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedApps.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No rejected applications.</p>
                </Card>
              ) : (
                rejectedApps.map((app: any) => (
                  <Card key={app._id?.toString()} className="p-6 opacity-60">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>F</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">Freelancer Name</h3>
                        <p className="text-sm text-muted-foreground">Budget: ${app.proposedBudget?.toLocaleString()}</p>
                      </div>
                      <Badge variant="secondary">Rejected</Badge>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
