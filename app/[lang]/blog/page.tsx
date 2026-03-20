import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

const blogPosts = [
  {
    id: 1,
    title: "10 Tips for Hiring the Perfect Freelance Developer",
    excerpt:
      "Learn how to identify, evaluate, and hire top-tier freelance developers for your next project. From technical assessments to cultural fit.",
    category: "Hiring",
    author: "Sarah Johnson",
    date: "2025-01-15",
    readTime: "5 min read",
    image: "/blog-hiring-tips.jpg",
  },
  {
    id: 2,
    title: "The Future of Remote Work in Tech",
    excerpt:
      "Explore the trends shaping the future of remote work in the technology industry and how freelancers can stay ahead of the curve.",
    category: "Trends",
    author: "Michael Chen",
    date: "2025-01-10",
    readTime: "7 min read",
    image: "/blog-remote-work.jpg",
  },
  {
    id: 3,
    title: "How AI is Transforming Freelance Marketplaces",
    excerpt:
      "Discover how artificial intelligence is revolutionizing the way freelancers and clients connect, collaborate, and succeed.",
    category: "Technology",
    author: "Emily Rodriguez",
    date: "2025-01-05",
    readTime: "6 min read",
    image: "/blog-ai-marketplace.jpg",
  },
  {
    id: 4,
    title: "Building a Successful Freelance Career in 2025",
    excerpt:
      "Essential strategies for freelancers looking to build a thriving career in the competitive tech landscape of 2025.",
    category: "Career",
    author: "David Park",
    date: "2024-12-28",
    readTime: "8 min read",
    image: "/blog-freelance-career.jpg",
  },
  {
    id: 5,
    title: "Cybersecurity Best Practices for Remote Teams",
    excerpt:
      "Protect your remote team and projects with these essential cybersecurity practices every freelancer and client should know.",
    category: "Security",
    author: "Lisa Wang",
    date: "2024-12-20",
    readTime: "6 min read",
    image: "/blog-cybersecurity.jpg",
  },
  {
    id: 6,
    title: "The Rise of AI and ML Freelancers",
    excerpt:
      "Why AI and machine learning specialists are in high demand and how to position yourself in this growing market.",
    category: "AI & ML",
    author: "James Miller",
    date: "2024-12-15",
    readTime: "5 min read",
    image: "/blog-ai-ml-freelancers.jpg",
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Blog
            </Badge>
            <h1 className="text-4xl font-bold mb-6 sm:text-5xl">
              Insights, tips, and stories
              <br />
              <span className="gradient-text">from the NRBTalents community</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Stay updated with the latest trends, best practices, and success stories from the world of tech
              freelancing.
            </p>
          </div>

          {/* Featured Post */}
          <Card className="mb-12 overflow-hidden hover:border-primary/50 transition-all">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-auto">
                <img
                  src={blogPosts[0].image || "/placeholder.svg?height=400&width=600"}
                  alt={blogPosts[0].title}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-4 left-4">{blogPosts[0].category}</Badge>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(blogPosts[0].date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {blogPosts[0].readTime}
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-3">{blogPosts[0].title}</h2>
                <p className="text-muted-foreground mb-6">{blogPosts[0].excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">By {blogPosts[0].author}</span>
                  <Button variant="outline" asChild>
                    <Link href={`/blog/${blogPosts[0].id}`}>
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Blog Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.slice(1).map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card className="overflow-hidden hover:border-primary/50 transition-all h-full group">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image || "/placeholder.svg?height=300&width=400"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-3 right-3">{post.category}</Badge>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readTime}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="text-sm text-muted-foreground">By {post.author}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
