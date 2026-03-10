// /app/(dashboard)/layout.tsx - AJOUTER DANS LA NAVIGATION
import {
  Home,
  Briefcase,
  MessageSquare,
  DollarSign,
  Users, // ← NOUVEAU
  BarChart,
  Settings,
  Bell,
  Search,
  Calendar,
  FileText,
  Target,
  Award,
  Heart,
  Globe,
  Layers,
  TrendingUp,
  Plus
} from "lucide-react"

// Dans votre menu de navigation
const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Projets",
    href: "/projects",
    icon: Briefcase,
  },
  {
    label: "Groupes", // ← NOUVEAU SECTION GROUPES
    href: "/groups",
    icon: Users,
    submenu: [
      {
        label: "Explorer les groupes",
        href: "/groups",
        icon: Globe,
        description: "Découvrez toutes les communautés"
      },
      {
        label: "Mes groupes",
        href: "/groups/my-groups",
        icon: Users,
        description: "Vos communautés actives"
      },
      {
        label: "Groupes recommandés",
        href: "/groups/recommended",
        icon: TrendingUp,
        description: "Groupes qui pourraient vous intéresser"
      },
      {
        label: "Créer un groupe",
        href: "/groups/create",
        icon: Plus,
        description: "Lancez votre propre communauté"
      },
      {
        label: "Événements",
        href: "/groups/events",
        icon: Calendar,
        description: "Événements à venir"
      },
      {
        label: "Offres d'emploi",
        href: "/groups/jobs",
        icon: Briefcase,
        description: "Opportunités dans les groupes"
      }
    ]
  },
  {
    label: "Messagerie",
    href: "/messages",
    icon: MessageSquare,
  },
  {
    label: "Finances",
    href: "/finances",
    icon: DollarSign,
  },
  {
    label: "Analytiques",
    href: "/analytics",
    icon: BarChart,
  },
]