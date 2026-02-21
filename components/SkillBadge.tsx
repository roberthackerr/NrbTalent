import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skills } from "@/lib/models/skills"

interface SkillBadgeProps {
  skill: Skills
  featured?: boolean
}

export function SkillBadge({ skill, featured = false }: SkillBadgeProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
      case "intermediate":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
      case "advanced":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800"
      case "expert":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "beginner":
        return <TrendingUp className="h-3 w-3" />
      case "intermediate":
        return <TrendingUp className="h-3 w-3" />
      case "advanced":
        return <Star className="h-3 w-3" />
      case "expert":
        return <Star className="h-3 w-3 fill-current" />
      default:
        return <TrendingUp className="h-3 w-3" />
    }
  }

  const getLevelText = (level: string) => {
    switch (level) {
      case "beginner": return "Débutant"
      case "intermediate": return "Intermédiaire"
      case "advanced": return "Avancé"
      case "expert": return "Expert"
      default: return level
    }
  }

  return (
    <div className="relative group">
      <Badge 
        variant="outline"
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium transition-all group-hover:scale-105",
          featured 
            ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-800 dark:from-yellow-950/30 dark:to-orange-950/30 dark:border-yellow-800 dark:text-yellow-300 shadow-sm"
            : getLevelColor(skill.level)
        )}
      >
        {/* Icône de niveau */}
        <div className={cn(
          "flex items-center justify-center",
          featured && "text-yellow-600 dark:text-yellow-400"
        )}>
          {getLevelIcon(skill.level)}
        </div>

        {/* Nom de la compétence */}
        <span className={cn(
          "font-semibold",
          featured && "text-yellow-900 dark:text-yellow-200"
        )}>
          {skill.name}
        </span>

        {/* Années d'expérience */}
        <div className={cn(
          "flex items-center gap-1 text-xs",
          featured 
            ? "text-yellow-700 dark:text-yellow-400"
            : "text-current opacity-80"
        )}>
          <Clock className="h-2.5 w-2.5" />
          <span>{skill.yearsOfExperience}</span>
        </div>

        {/* Badge vedette */}
        {featured && (
          <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
        )}
      </Badge>

      {/* Tooltip au hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
        <div className="font-semibold">{skill.name}</div>
        <div className="flex items-center gap-2 mt-1">
          <span>{getLevelText(skill.level)}</span>
          <span>•</span>
          <span>{skill.yearsOfExperience} an{skill.yearsOfExperience > 1 ? 's' : ''}</span>
          {skill.featured && (
            <>
              <span>•</span>
              <span className="text-yellow-400">Vedette</span>
            </>
          )}
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
      </div>
    </div>
  )
}