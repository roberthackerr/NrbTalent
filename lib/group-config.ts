// /lib/group-config.ts
export const GROUP_CONFIG = {
  // Limites
  limits: {
    maxGroupsPerUser: 20,
    maxPostsPerDay: 10,
    maxMembers: 10000,
    maxSkills: 20,
    maxTags: 15
  },
  
  // Configuration par défaut
  defaults: {
    avatar: '/api/placeholder/400/400?text=G',
    banner: '/api/placeholder/1200/300?text=',
    color: '#3b82f6',
    rules: {
      allowPosts: true,
      allowEvents: true,
      allowJobs: true,
      allowFiles: true,
      requireApproval: false,
      maxPostsPerDay: 5,
      minAccountAge: 0
    }
  },
  
  // Types de groupe
  types: {
    skill: {
      name: 'Compétences',
      description: 'Groupes par domaine d\'expertise',
      icon: '💼',
      color: '#3b82f6'
    },
    location: {
      name: 'Localisation',
      description: 'Groupes géographiques',
      icon: '📍',
      color: '#10b981'
    },
    professional: {
      name: 'Professionnel',
      description: 'Groupes par métier',
      icon: '👔',
      color: '#f59e0b'
    },
    company: {
      name: 'Entreprise',
      description: 'Groupes d\'entreprise',
      icon: '🏢',
      color: '#ef4444'
    },
    learning: {
      name: 'Apprentissage',
      description: 'Groupes d\'apprentissage',
      icon: '🎓',
      color: '#8b5cf6'
    },
    interest: {
      name: 'Intérêt',
      description: 'Groupes par centre d\'intérêt',
      icon: '❤️',
      color: '#ec4899'
    }
  },
  
  // Badges de groupe
  badges: {
    verified: {
      name: 'Vérifié',
      description: 'Groupe officiel vérifié',
      color: 'blue'
    },
    featured: {
      name: 'Mis en avant',
      description: 'Groupe sélectionné par l\'équipe',
      color: 'purple'
    },
    popular: {
      name: 'Populaire',
      description: 'Plus de 1000 membres',
      color: 'green'
    },
    active: {
      name: 'Actif',
      description: 'Forte activité quotidienne',
      color: 'orange'
    },
    exclusive: {
      name: 'Exclusif',
      description: 'Groupe privé sur invitation',
      color: 'red'
    }
  }
}