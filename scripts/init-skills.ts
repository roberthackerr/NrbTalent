// scripts/init-skills.ts
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const defaultSkills = [
  // Web Development
  { name: "React", category: "Développement Web" },
  { name: "TypeScript", category: "Développement Web" },
  { name: "Node.js", category: "Développement Web" },
  { name: "Python", category: "Développement Web" },
  { name: "Next.js", category: "Développement Web" },
  { name: "Vue.js", category: "Développement Web" },
  { name: "Angular", category: "Développement Web" },
  { name: "PHP", category: "Développement Web" },
  { name: "Laravel", category: "Développement Web" },
  { name: "Symfony", category: "Développement Web" },
  { name: "Java", category: "Développement Web" },
  { name: "Spring Boot", category: "Développement Web" },
  { name: "C#", category: "Développement Web" },
  { name: ".NET", category: "Développement Web" },
  { name: "GraphQL", category: "Développement Web" },
  { name: "REST API", category: "Développement Web" },
  { name: "HTML5", category: "Développement Web" },
  { name: "CSS3", category: "Développement Web" },
  { name: "SASS", category: "Développement Web" },
  { name: "Tailwind CSS", category: "Développement Web" },
  { name: "Bootstrap", category: "Développement Web" },
  { name: "jQuery", category: "Développement Web" },
  { name: "Webpack", category: "Développement Web" },
  { name: "Vite", category: "Développement Web" },
  { name: "Jest", category: "Développement Web" },
  { name: "Cypress", category: "Développement Web" },
  
  // Mobile Development
  { name: "Swift", category: "Développement Mobile" },
  { name: "Kotlin", category: "Développement Mobile" },
  { name: "Flutter", category: "Développement Mobile" },
  { name: "React Native", category: "Développement Mobile" },
  { name: "Ionic", category: "Développement Mobile" },
  { name: "Xamarin", category: "Développement Mobile" },
  { name: "Android Studio", category: "Développement Mobile" },
  { name: "Xcode", category: "Développement Mobile" },
  { name: "SwiftUI", category: "Développement Mobile" },
  { name: "Jetpack Compose", category: "Développement Mobile" },
  
  // DevOps
  { name: "Docker", category: "DevOps" },
  { name: "Kubernetes", category: "DevOps" },
  { name: "AWS", category: "DevOps" },
  { name: "Azure", category: "DevOps" },
  { name: "Google Cloud", category: "DevOps" },
  { name: "DevOps", category: "DevOps" },
  { name: "Jenkins", category: "DevOps" },
  { name: "GitLab CI", category: "DevOps" },
  { name: "GitHub Actions", category: "DevOps" },
  { name: "Terraform", category: "DevOps" },
  { name: "Ansible", category: "DevOps" },
  { name: "Prometheus", category: "DevOps" },
  { name: "Grafana", category: "DevOps" },
  { name: "ELK Stack", category: "DevOps" },
  
  // Base de données
  { name: "MongoDB", category: "Base de données" },
  { name: "PostgreSQL", category: "Base de données" },
  { name: "MySQL", category: "Base de données" },
  { name: "Redis", category: "Base de données" },
  { name: "Elasticsearch", category: "Base de données" },
  { name: "Cassandra", category: "Base de données" },
  { name: "MariaDB", category: "Base de données" },
  { name: "SQLite", category: "Base de données" },
  { name: "Oracle", category: "Base de données" },
  { name: "SQL Server", category: "Base de données" },
  { name: "Firebase", category: "Base de données" },
  { name: "Supabase", category: "Base de données" },
  
  // Design
  { name: "Figma", category: "Design UI/UX" },
  { name: "Adobe XD", category: "Design UI/UX" },
  { name: "Photoshop", category: "Design UI/UX" },
  { name: "Illustrator", category: "Design UI/UX" },
  { name: "InDesign", category: "Design UI/UX" },
  { name: "After Effects", category: "Design UI/UX" },
  { name: "Premiere Pro", category: "Design UI/UX" },
  { name: "Sketch", category: "Design UI/UX" },
  { name: "InVision", category: "Design UI/UX" },
  { name: "Zeplin", category: "Design UI/UX" },
  { name: "UI/UX Design", category: "Design UI/UX" },
  { name: "Wireframing", category: "Design UI/UX" },
  { name: "Prototyping", category: "Design UI/UX" },
  { name: "User Research", category: "Design UI/UX" },
  
  // Data Science
  { name: "Data Science", category: "Data Science" },
  { name: "Machine Learning", category: "Data Science" },
  { name: "Deep Learning", category: "Data Science" },
  { name: "IA", category: "Data Science" },
  { name: "Python", category: "Data Science" },
  { name: "R", category: "Data Science" },
  { name: "TensorFlow", category: "Data Science" },
  { name: "PyTorch", category: "Data Science" },
  { name: "Scikit-learn", category: "Data Science" },
  { name: "Pandas", category: "Data Science" },
  { name: "NumPy", category: "Data Science" },
  { name: "Matplotlib", category: "Data Science" },
  { name: "Tableau", category: "Data Science" },
  { name: "Power BI", category: "Data Science" },
  { name: "Big Data", category: "Data Science" },
  { name: "Hadoop", category: "Data Science" },
  { name: "Spark", category: "Data Science" },
  
  // Marketing
  { name: "SEO", category: "Marketing Digital" },
  { name: "SEM", category: "Marketing Digital" },
  { name: "Marketing Digital", category: "Marketing Digital" },
  { name: "Content Writing", category: "Marketing Digital" },
  { name: "Social Media", category: "Marketing Digital" },
  { name: "Email Marketing", category: "Marketing Digital" },
  { name: "Google Analytics", category: "Marketing Digital" },
  { name: "Google Ads", category: "Marketing Digital" },
  { name: "Facebook Ads", category: "Marketing Digital" },
  { name: "Instagram Marketing", category: "Marketing Digital" },
  { name: "LinkedIn Marketing", category: "Marketing Digital" },
  { name: "TikTok Marketing", category: "Marketing Digital" },
  { name: "Copywriting", category: "Marketing Digital" },
  { name: "Brand Strategy", category: "Marketing Digital" },
  { name: "Market Research", category: "Marketing Digital" },
  
  // Gestion de projet
  { name: "Agile", category: "Gestion de projet" },
  { name: "Scrum", category: "Gestion de projet" },
  { name: "Kanban", category: "Gestion de projet" },
  { name: "JIRA", category: "Gestion de projet" },
  { name: "Trello", category: "Gestion de projet" },
  { name: "Asana", category: "Gestion de projet" },
  { name: "Notion", category: "Gestion de projet" },
  { name: "ClickUp", category: "Gestion de projet" },
  { name: "Monday.com", category: "Gestion de projet" },
  { name: "PMP", category: "Gestion de projet" },
  { name: "Prince2", category: "Gestion de projet" },
  
  // Communication
  { name: "Rédaction", category: "Communication" },
  { name: "Traduction", category: "Communication" },
  { name: "Français", category: "Communication" },
  { name: "Anglais", category: "Communication" },
  { name: "Malagasy", category: "Communication" },
  { name: "Espagnol", category: "Communication" },
  { name: "Allemand", category: "Communication" },
  { name: "Chinois", category: "Communication" },
  { name: "Arabe", category: "Communication" },
  { name: "Communication", category: "Communication" },
  { name: "Négociation", category: "Communication" },
  { name: "Présentation", category: "Communication" },
  
  // Consulting
  { name: "Consulting", category: "Consulting" },
  { name: "Stratégie", category: "Consulting" },
  { name: "Management", category: "Consulting" },
  { name: "Innovation", category: "Consulting" },
  { name: "Transformation Digitale", category: "Consulting" },
  { name: "Business Development", category: "Consulting" },
  { name: "Lean", category: "Consulting" },
  { name: "Six Sigma", category: "Consulting" },
  
  // Autres
  { name: "Blockchain", category: "Autre" },
  { name: "Cryptomonnaie", category: "Autre" },
  { name: "NFT", category: "Autre" },
  { name: "Web3", category: "Autre" },
  { name: "Cybersécurité", category: "Autre" },
  { name: "Ethical Hacking", category: "Autre" },
  { name: "Réseaux", category: "Autre" },
  { name: "Sécurité", category: "Autre" },
  { name: "IoT", category: "Autre" },
  { name: "Robotique", category: "Autre" },
  { name: "AR/VR", category: "Autre" },
  { name: "Gaming", category: "Autre" },
  { name: "3D Modeling", category: "Autre" },
  { name: "Animation", category: "Autre" },
  { name: "Vidéo", category: "Autre" },
  { name: "Photographie", category: "Autre" },
  { name: "Musique", category: "Autre" },
]

// Niveaux de compétence
const levels = ['beginner', 'intermediate', 'advanced', 'expert']

// Fonction pour générer un nombre aléatoire entre min et max
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Fonction pour obtenir un niveau aléatoire
function randomLevel(): string {
  return levels[Math.floor(Math.random() * levels.length)]
}

async function initSkills() {
  try {
    const db = await getDatabase()
    
    console.log('🔄 Initialisation des compétences...')
    console.log(`📊 ${defaultSkills.length} compétences à traiter`)
    
    // 1. CRÉER LA COLLECTION SKILLS
    console.log('\n📁 Création de la collection skills...')
    let skillsCreated = 0
    for (const skill of defaultSkills) {
      const result = await db.collection('skills').updateOne(
        { name: skill.name },
        { 
          $set: { 
            name: skill.name,
            category: skill.category,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date(),
            popularity: randomInt(0, 1000)
          }
        },
        { upsert: true }
      )
      if (result.upsertedCount > 0) skillsCreated++
    }
    console.log(`✅ ${skillsCreated} nouvelles compétences ajoutées`)
    console.log(`✅ Total: ${defaultSkills.length} compétences dans la base`)

    // 2. RÉCUPÉRER TOUS LES UTILISATEURS
    console.log('\n👥 Récupération des utilisateurs...')
    const users = await db.collection('users').find({}).toArray()
    console.log(`✅ ${users.length} utilisateurs trouvés`)

    // 3. METTRE À JOUR CHAQUE UTILISATEUR
    console.log('\n🔄 Mise à jour des compétences des utilisateurs...')
    
    let updatedCount = 0
    for (const user of users) {
      // Déterminer le nombre de compétences pour cet utilisateur (entre 3 et 15)
      const skillCount = randomInt(5, 15)
      
      // Sélectionner des compétences aléatoires
      const shuffled = [...defaultSkills].sort(() => 0.5 - Math.random())
      const selectedSkills = shuffled.slice(0, skillCount)
      
      // Générer les compétences avec niveaux et expérience
      const userSkills = selectedSkills.map((skill, index) => ({
        id: `${user._id}-skill-${Date.now()}-${index}`,
        name: skill.name,
        category: skill.category,
        level: randomLevel(),
        yearsOfExperience: randomInt(1, 12),
        featured: index < 3 // Les 3 premières en vedette
      }))
      
      // Mettre à jour l'utilisateur
      await db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: { 
            skills: userSkills,
            updatedAt: new Date()
          }
        }
      )
      
      updatedCount++
      if (updatedCount % 10 === 0) {
        console.log(`  ⏳ ${updatedCount}/${users.length} utilisateurs traités...`)
      }
    }
    
    console.log(`✅ ${updatedCount}/${users.length} utilisateurs mis à jour avec des compétences`)

    // 4. METTRE À JOUR LA POPULARITÉ DES COMPÉTENCES
    console.log('\n📊 Calcul de la popularité des compétences...')
    
    // Agrégation pour compter les occurrences de chaque compétence
    const popularityData = await db.collection('users').aggregate([
      { $unwind: '$skills' },
      { $group: { 
          _id: '$skills.name', 
          count: { $sum: 1 },
          avgLevel: { $avg: {
            $switch: {
              branches: [
                { case: { $eq: ['$skills.level', 'beginner'] }, then: 1 },
                { case: { $eq: ['$skills.level', 'intermediate'] }, then: 2 },
                { case: { $eq: ['$skills.level', 'advanced'] }, then: 3 },
                { case: { $eq: ['$skills.level', 'expert'] }, then: 4 }
              ],
              default: 2
            }
          }}
        }
      },
      { $sort: { count: -1 } }
    ]).toArray()
    
    // Mettre à jour la collection skills avec les données de popularité
    for (const data of popularityData) {
      await db.collection('skills').updateOne(
        { name: data._id },
        { 
          $set: { 
            popularity: data.count,
            averageLevel: data.avgLevel,
            lastCalculated: new Date()
          }
        }
      )
    }
    
    console.log(`✅ Popularité mise à jour pour ${popularityData.length} compétences`)

    // 5. AFFICHER LES STATISTIQUES
    console.log('\n📈 STATISTIQUES FINALES:')
    console.log(`   • Compétences totales: ${defaultSkills.length}`)
    console.log(`   • Utilisateurs avec compétences: ${updatedCount}`)
    console.log(`   • Compétences populaires: ${popularityData.slice(0, 10).map(d => d._id).join(', ')}`)
    
    // Top 5 des compétences
    console.log('\n🏆 TOP 5 DES COMPÉTENCES LES PLUS POPULAIRES:')
    popularityData.slice(0, 5).forEach((skill, index) => {
      console.log(`   ${index + 1}. ${skill._id} (${skill.count} utilisateurs, niveau moyen: ${skill.avgLevel.toFixed(1)}/4)`)
    })

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    throw error
  }
}

// Exécuter le script avec gestion d'erreur améliorée
async function main() {
  try {
    console.log('🚀 DÉBUT DE L\'INITIALISATION DES COMPÉTENCES')
    console.log('='.repeat(50))
    
    await initSkills()
    
    console.log('='.repeat(50))
    console.log('🎉 INITIALISATION TERMINÉE AVEC SUCCÈS!')
    
    process.exit(0)
  } catch (error) {
    console.error('💥 ERREUR FATALE:', error)
    process.exit(1)
  }
}

main()