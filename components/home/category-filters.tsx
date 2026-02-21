"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const categories = [
  { id: "all", name: "Tous", count: 12458 },
  { id: "web", name: "Développement Web", count: 3456, icon: "💻" },
  { id: "mobile", name: "Mobile", count: 1890, icon: "📱" },
  { id: "design", name: "Design UI/UX", count: 2678, icon: "🎨" },
  { id: "marketing", name: "Marketing", count: 1567, icon: "📈" },
  { id: "writing", name: "Rédaction", count: 2345, icon: "✍️" },
  { id: "ai", name: "IA & Data", count: 987, icon: "🤖" },
  { id: "consulting", name: "Consulting", count: 1534, icon: "💼" }
]

interface CategoryFiltersProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryFilters({ selectedCategory, onCategoryChange }: CategoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          onClick={() => onCategoryChange(category.id)}
          className={cn(
            "relative h-auto py-2 px-4 rounded-full transition-all",
            selectedCategory === category.id 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" 
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
          )}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            {category.icon && <span>{category.icon}</span>}
            {category.name}
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs",
                selectedCategory === category.id 
                  ? "bg-white/20 text-white" 
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              )}
            >
              {category.count.toLocaleString()}
            </Badge>
          </span>
        </Button>
      ))}
    </div>
  )
}