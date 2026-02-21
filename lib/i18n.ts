export const locales = ["en", "fr"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const translations = {
  en: {
    nav: {
      home: "Home",
      talents: "Find Talents",
      services: "Browse Services",
      howItWorks: "How It Works",
      pricing: "Pricing",
      signIn: "Sign In",
      signUp: "Get Started",
      dashboard: "Dashboard",
      messages: "Messages",
      settings: "Settings",
      logout: "Logout",
    },
    hero: {
      badge: "Powered by AI Matching Technology",
      title: "The complete platform",
      titleHighlight: "to build with talent.",
      description:
        "Connect with elite tech freelancers specializing in development, AI, cybersecurity, and telecommunications. Build transformative projects with verified professionals.",
      getStarted: "Get Started",
      browseTalents: "Browse Talents",
      noCreditCard: "No credit card required",
      freeToStart: "Free to start",
      professionals: "2,500+ verified professionals",
    },
    stats: {
      freelancers: "Verified Freelancers",
      satisfaction: "Client Satisfaction",
      projects: "Projects Completed",
      support: "Support Available",
    },
    features: {
      title: "Everything you need to succeed",
      description: "Powerful tools and features designed to make collaboration seamless and secure.",
      aiMatching: {
        title: "AI-Powered Matching",
        description:
          "Our intelligent algorithm finds the perfect freelancer for your project based on skills, experience, and availability.",
      },
      securePayments: {
        title: "Secure Payments",
        description:
          "Escrow system ensures your funds are protected. Payment is released only when you're satisfied with the work.",
      },
      fastHiring: {
        title: "Fast Hiring",
        description:
          "Post your project and receive qualified applications within hours. Start working in less than 24 hours.",
      },
      teamCollaboration: {
        title: "Team Collaboration",
        description:
          "Built-in messaging, file sharing, and project management tools keep everyone aligned and productive.",
      },
      qualityAssurance: {
        title: "Quality Assurance",
        description: "All freelancers are verified and rated. Review portfolios, ratings, and past work before hiring.",
      },
      support: {
        title: "24/7 Support",
        description: "Our dedicated support team is always available to help you resolve any issues quickly.",
      },
    },
    cta: {
      title: "Ready to build something amazing?",
      description: "Join thousands of companies and freelancers who trust NRBTalents for their projects.",
      startProject: "Start Your Project",
      learnMore: "Learn More",
    },
    footer: {
      tagline: "Where true talent meets innovation.",
      platform: "Platform",
      company: "Company",
      legal: "Legal",
      copyright: "All rights reserved.",
    },
  },
  fr: {
    nav: {
      home: "Accueil",
      talents: "Trouver des Talents",
      services: "Parcourir les Services",
      howItWorks: "Comment ça marche",
      pricing: "Tarifs",
      signIn: "Se connecter",
      signUp: "Commencer",
      dashboard: "Tableau de bord",
      messages: "Messages",
      settings: "Paramètres",
      logout: "Déconnexion",
    },
    hero: {
      badge: "Propulsé par la technologie de matching IA",
      title: "La plateforme complète",
      titleHighlight: "pour construire avec les talents.",
      description:
        "Connectez-vous avec des freelances tech d'élite spécialisés en développement, IA, cybersécurité et télécommunications. Construisez des projets transformateurs avec des professionnels vérifiés.",
      getStarted: "Commencer",
      browseTalents: "Parcourir les Talents",
      noCreditCard: "Aucune carte de crédit requise",
      freeToStart: "Gratuit pour commencer",
      professionals: "2 500+ professionnels vérifiés",
    },
    stats: {
      freelancers: "Freelances Vérifiés",
      satisfaction: "Satisfaction Client",
      projects: "Projets Complétés",
      support: "Support Disponible",
    },
    features: {
      title: "Tout ce dont vous avez besoin pour réussir",
      description: "Des outils et fonctionnalités puissants conçus pour rendre la collaboration fluide et sécurisée.",
      aiMatching: {
        title: "Matching IA",
        description:
          "Notre algorithme intelligent trouve le freelance parfait pour votre projet en fonction des compétences, de l'expérience et de la disponibilité.",
      },
      securePayments: {
        title: "Paiements Sécurisés",
        description:
          "Le système d'entiercement garantit la protection de vos fonds. Le paiement n'est libéré que lorsque vous êtes satisfait du travail.",
      },
      fastHiring: {
        title: "Recrutement Rapide",
        description:
          "Publiez votre projet et recevez des candidatures qualifiées en quelques heures. Commencez à travailler en moins de 24 heures.",
      },
      teamCollaboration: {
        title: "Collaboration d'Équipe",
        description:
          "Messagerie intégrée, partage de fichiers et outils de gestion de projet pour garder tout le monde aligné et productif.",
      },
      qualityAssurance: {
        title: "Assurance Qualité",
        description:
          "Tous les freelances sont vérifiés et notés. Consultez les portfolios, les évaluations et les travaux antérieurs avant d'embaucher.",
      },
      support: {
        title: "Support 24/7",
        description:
          "Notre équipe de support dédiée est toujours disponible pour vous aider à résoudre rapidement tout problème.",
      },
    },
    cta: {
      title: "Prêt à construire quelque chose d'incroyable ?",
      description:
        "Rejoignez des milliers d'entreprises et de freelances qui font confiance à NRBTalents pour leurs projets.",
      startProject: "Démarrer Votre Projet",
      learnMore: "En Savoir Plus",
    },
    footer: {
      tagline: "Où le vrai talent rencontre l'innovation.",
      platform: "Plateforme",
      company: "Entreprise",
      legal: "Légal",
      copyright: "Tous droits réservés.",
    },
  },
}

export function getTranslations(locale: Locale) {
  return translations[locale] || translations[defaultLocale]
}
