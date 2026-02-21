# NRBTalents - Plateforme Freelance Premium

Une marketplace freelance moderne et complète connectant les professionnels tech avec des clients du monde entier.

![NRBTalents Logo](public/logo.png)

## Fonctionnalités Principales

### Pour les Freelances
- Parcourir et rechercher des projets par catégorie et compétences
- Soumettre des candidatures avec propositions personnalisées
- Messagerie en temps réel avec les clients
- Appels vidéo intégrés pour les réunions
- Suivre les revenus et analytics de performance
- Créer des profils complets avec portfolio
- Créer des services/gigs prédéfinis (comme Fiverr)
- Passer des tests de compétences
- Système de badges et certifications
- Espace de travail collaboratif avec gestion de tâches
- Calendrier intégré avec synchronisation Google/Outlook
- Programme de parrainage
- Système de réputation transparent

### Pour les Clients
- Publier des projets avec exigences détaillées
- Recherche intelligente de freelances par IA
- Examiner et gérer les candidatures
- Paiements sécurisés via Stripe avec jalons
- Trouver et embaucher les meilleurs talents
- Suivre la progression des projets
- Tableau de bord analytics
- Évaluer les freelances après achèvement
- Génération automatique de contrats
- Facturation automatique

### Fonctionnalités de la Plateforme
- Authentification NextAuth avec Google OAuth
- Accès basé sur les rôles (freelance/client)
- Base de données MongoDB avec schémas optimisés
- Intégration Stripe avec frais de plateforme (10%)
- Système de notifications en temps réel
- Analytics avancés avec graphiques interactifs
- Chat vidéo intégré
- Système de vérification d'identité
- Support multi-langues (Français/Anglais)
- Mode sombre/clair
- Recherche globale avec raccourcis clavier (Cmd/Ctrl+K)
- Design responsive avec thème moderne
- Composants UI modernes avec Radix UI

## Stack Technique

- **Framework**: Next.js 15 (App Router)
- **Authentification**: NextAuth.js avec Google OAuth
- **Base de données**: MongoDB
- **Paiements**: Stripe
- **Composants UI**: Radix UI
- **Styling**: Tailwind CSS v4
- **Graphiques**: Recharts
- **Icônes**: Lucide React
- **Formulaires**: React Hook Form + Zod
- **Thème**: next-themes
- **Internationalisation**: next-intl

## Démarrage Rapide

### Prérequis
- Node.js 18+ 
- MongoDB (local ou Atlas)
- Compte Stripe
- Compte Google Cloud (pour OAuth)

### Installation

1. Cloner le repository
\`\`\`bash
git clone https://github.com/votre-username/nrbtalents.git
cd nrbtalents
\`\`\`

2. Installer les dépendances
\`\`\`bash
npm install
\`\`\`

3. Configurer les variables d'environnement
\`\`\`bash
cp .env.example .env.local
\`\`\`

Remplir les variables dans `.env.local`:
- `MONGODB_URI`: Votre chaîne de connexion MongoDB
- `NEXTAUTH_SECRET`: Générer avec `openssl rand -base64 32`
- `NEXTAUTH_URL`: http://localhost:3000 (dev) ou votre URL de production
- `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`: Depuis Google Cloud Console
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`: Depuis Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET`: Pour les webhooks Stripe

4. Lancer le serveur de développement
\`\`\`bash
npm run dev
\`\`\`

5. Ouvrir [http://localhost:3000](http://localhost:3000)

## Configuration

### Google OAuth
1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un nouveau projet
3. Activer Google+ API
4. Créer des identifiants OAuth 2.0
5. Ajouter les URIs de redirection autorisées:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://votre-domaine.com/api/auth/callback/google` (prod)

### Stripe
1. Créer un compte sur [Stripe](https://stripe.com)
2. Récupérer les clés API depuis le Dashboard
3. Configurer les webhooks pour:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. URL du webhook: `https://votre-domaine.com/api/payments/webhook`

### MongoDB
1. Créer un cluster sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer une base de données
3. Ajouter votre IP à la whitelist
4. Copier la chaîne de connexion

## Structure du Projet

\`\`\`
nrbtalents/
├── app/
│   ├── api/              # Routes API
│   │   ├── auth/         # Authentification
│   │   ├── projects/     # Gestion des projets
│   │   ├── messages/     # Messagerie
│   │   ├── payments/     # Paiements Stripe
│   │   ├── gigs/         # Services prédéfinis
│   │   └── ...
│   ├── auth/             # Pages d'authentification
│   ├── dashboard/        # Tableaux de bord
│   │   ├── freelance/    # Dashboard freelance
│   │   ├── client/       # Dashboard client
│   │   └── ...
│   ├── talents/          # Annuaire public des talents
│   ├── services/         # Marketplace des services
│   ├── about/            # À propos
│   ├── blog/             # Blog
│   ├── faq/              # FAQ
│   └── page.tsx          # Page d'accueil
├── components/
│   ├── dashboard/        # Composants dashboard
│   ├── ui/               # Composants UI réutilisables
│   ├── navigation.tsx    # Navigation principale
│   └── ...
├── lib/
│   ├── models/           # Modèles MongoDB
│   ├── auth.ts           # Configuration NextAuth
│   ├── mongodb.ts        # Connexion base de données
│   ├── stripe.ts         # Configuration Stripe
│   └── i18n.ts           # Internationalisation
└── public/
    └── logo.png          # Logo NRBTalents
\`\`\`

## Scripts Disponibles

\`\`\`bash
npm run dev      # Démarrer le serveur de développement
npm run build    # Construire pour la production
npm run start    # Démarrer le serveur de production
npm run lint     # Linter le code
\`\`\`

## Déploiement

### Déployer sur Vercel

1. Pusher votre code sur GitHub
2. Importer le projet sur [Vercel](https://vercel.com)
3. Ajouter toutes les variables d'environnement
4. Déployer

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Variables d'environnement de production

Assurez-vous d'ajouter toutes les variables d'environnement dans les paramètres de votre projet Vercel:
- Toutes les variables de `.env.example`
- Mettre à jour `NEXTAUTH_URL` avec votre domaine de production
- Utiliser les clés Stripe de production (pas les clés de test)

## Fonctionnalités Détaillées

### Système de Matching IA
Algorithme intelligent qui analyse:
- Compétences requises vs compétences du freelance
- Budget du projet vs tarif horaire
- Disponibilité du freelance
- Rating et taux de succès
- Score de compatibilité jusqu'à 100 points

### Espace de Travail Collaboratif
- Tableau Kanban pour la gestion des tâches
- Upload et partage de fichiers
- Commentaires sur les tâches
- Jalons de paiement progressifs
- Calendrier de projet intégré

### Système de Réputation
- Notation sur 5 étoiles
- Soft skills évalués (communication, professionnalisme, fiabilité, qualité, respect des deadlines, collaboration)
- Badges de compétences
- Historique complet des projets
- Taux de succès visible

### Tests de Compétences
- Quiz par catégorie (Dev, IA, Cybersécurité, Telecom)
- Validation des compétences
- Badges de certification
- Affichage sur le profil

### Programme de Parrainage
- Lien de parrainage unique
- Récompenses pour le parrain et le filleul
- Suivi des parrainages
- Dashboard dédié

## Support et Contribution

Pour toute question ou problème:
- Ouvrir une issue sur GitHub
- Contacter le support via la page Contact
- Consulter la FAQ

## Licence

MIT License - Libre d'utilisation pour vos propres projets.

## Auteur

NRBTalents - Plateforme freelance nouvelle génération

---

Fait avec ❤️ par l'équipe NRBTalents
