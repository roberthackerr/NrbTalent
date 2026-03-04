import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Award, CheckCircle2 } from "lucide-react"

const skillTests = [
  {
    id: 1,
    title: "React.js Fundamentals",
    category: "Development",
    duration: 30,
    questions: 25,
    passingScore: 80,
    difficulty: "Intermediate",
    completed: true,
    score: 92,
  },
  {
    id: 2,
    title: "Node.js & Express",
    category: "Development",
    duration: 45,
    questions: 30,
    passingScore: 75,
    difficulty: "Advanced",
    completed: false,
  },
  {
    id: 3,
    title: "Machine Learning Basics",
    category: "AI & ML",
    duration: 60,
    questions: 40,
    passingScore: 80,
    difficulty: "Advanced",
    completed: false,
  },
  {
    id: 4,
    title: "Cybersecurity Essentials",
    category: "Security",
    duration: 40,
    questions: 35,
    passingScore: 85,
    difficulty: "Intermediate",
    completed: true,
    score: 88,
  },
]

export default function SkillTestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Skill Tests</h1>
        <p className="text-muted-foreground">
          Validate your skills and earn badges to stand out to clients. Completed tests appear on your profile.
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">2</div>
              <div className="text-sm text-muted-foreground">Tests Passed</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">90%</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">2</div>
              <div className="text-sm text-muted-foreground">Tests Remaining</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Tests */}
      <div>
        <h2 className="text-xl font-bold mb-4">Available Tests</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {skillTests.map((test) => (
            <Card key={test.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold mb-1">{test.title}</h3>
                  <Badge variant="secondary">{test.category}</Badge>
                </div>
                {test.completed && (
                  <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Passed
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{test.duration} minutes</span>
                  <span>•</span>
                  <span>{test.questions} questions</span>
                </div>
                <div>
                  Difficulty: <span className="font-medium text-foreground">{test.difficulty}</span>
                </div>
                <div>
                  Passing Score: <span className="font-medium text-foreground">{test.passingScore}%</span>
                </div>
                {test.completed && test.score && (
                  <div>
                    Your Score: <span className="font-bold text-green-500">{test.score}%</span>
                  </div>
                )}
              </div>

              <Button className="w-full" variant={test.completed ? "outline" : "default"}>
                {test.completed ? "Retake Test" : "Start Test"}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
