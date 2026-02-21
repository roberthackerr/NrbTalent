import { getDatabase } from '@/lib/mongodb';

interface Skill {
  skill: string;
  count: number;
  avgBudget: number;
}

const popularSkills: Skill[] = [
  // Développement Web Frontend
  { skill: "React", count: 2450, avgBudget: 8500 },
  { skill: "Next.js", count: 1870, avgBudget: 9200 },
  { skill: "TypeScript", count: 2150, avgBudget: 8800 },
  { skill: "Vue.js", count: 1320, avgBudget: 7800 },
  { skill: "Angular", count: 980, avgBudget: 8200 },
  { skill: "JavaScript", count: 3250, avgBudget: 7500 },
  { skill: "HTML/CSS", count: 2870, avgBudget: 6500 },
  { skill: "Tailwind CSS", count: 1560, avgBudget: 7200 },
  
  // Développement Web Backend
  { skill: "Node.js", count: 1980, avgBudget: 8900 },
  { skill: "Python", count: 2230, avgBudget: 9100 },
  { skill: "Django", count: 870, avgBudget: 8300 },
  { skill: "FastAPI", count: 650, avgBudget: 8600 },
  { skill: "Java", count: 1420, avgBudget: 9500 },
  { skill: "Spring Boot", count: 1100, avgBudget: 9200 },
  { skill: "PHP", count: 1650, avgBudget: 6800 },
  { skill: "Laravel", count: 920, avgBudget: 7600 },
  { skill: "Ruby on Rails", count: 780, avgBudget: 8800 },
  { skill: "Express.js", count: 1430, avgBudget: 8100 },
  
  // Bases de données
  { skill: "MongoDB", count: 1320, avgBudget: 7800 },
  { skill: "PostgreSQL", count: 1180, avgBudget: 8200 },
  { skill: "MySQL", count: 1560, avgBudget: 7200 },
  { skill: "Redis", count: 890, avgBudget: 6900 },
  { skill: "Firebase", count: 1120, avgBudget: 7400 },
  { skill: "Supabase", count: 670, avgBudget: 7600 },
  
  // Mobile
  { skill: "React Native", count: 1340, avgBudget: 11500 },
  { skill: "Flutter", count: 980, avgBudget: 10800 },
  { skill: "Swift", count: 760, avgBudget: 12500 },
  { skill: "Kotlin", count: 690, avgBudget: 11800 },
  { skill: "Ionic", count: 450, avgBudget: 9200 },
  
  // DevOps & Cloud
  { skill: "Docker", count: 1280, avgBudget: 9500 },
  { skill: "Kubernetes", count: 890, avgBudget: 11200 },
  { skill: "AWS", count: 1420, avgBudget: 10800 },
  { skill: "Azure", count: 780, avgBudget: 10200 },
  { skill: "Google Cloud", count: 670, avgBudget: 10500 },
  { skill: "Terraform", count: 540, avgBudget: 9800 },
  { skill: "CI/CD", count: 920, avgBudget: 8900 },
  
  // AI & Machine Learning
  { skill: "Python ML", count: 1560, avgBudget: 12500 },
  { skill: "TensorFlow", count: 890, avgBudget: 13200 },
  { skill: "PyTorch", count: 780, avgBudget: 12800 },
  { skill: "OpenAI API", count: 1120, avgBudget: 11800 },
  { skill: "Computer Vision", count: 670, avgBudget: 14200 },
  { skill: "NLP", count: 540, avgBudget: 13800 },
  { skill: "Data Science", count: 1230, avgBudget: 11500 },
  
  // Design & UX/UI
  { skill: "Figma", count: 1870, avgBudget: 6800 },
  { skill: "Adobe XD", count: 920, avgBudget: 6200 },
  { skill: "Sketch", count: 780, avgBudget: 6500 },
  { skill: "UI/UX Design", count: 2340, avgBudget: 7200 },
  { skill: "Prototyping", count: 1120, avgBudget: 6900 },
  { skill: "Design System", count: 890, avgBudget: 7800 },
  
  // E-commerce
  { skill: "Shopify", count: 1340, avgBudget: 8200 },
  { skill: "WooCommerce", count: 980, avgBudget: 6800 },
  { skill: "Magento", count: 670, avgBudget: 9500 },
  { skill: "BigCommerce", count: 450, avgBudget: 7800 },
  
  // CMS
  { skill: "WordPress", count: 1980, avgBudget: 5800 },
  { skill: "Webflow", count: 1120, avgBudget: 7200 },
  { skill: "Strapi", count: 780, avgBudget: 8200 },
  { skill: "Contentful", count: 560, avgBudget: 7800 },
  
  // Testing
  { skill: "Jest", count: 890, avgBudget: 7200 },
  { skill: "Cypress", count: 670, avgBudget: 7800 },
  { skill: "Selenium", count: 540, avgBudget: 8200 },
  { skill: "Unit Testing", count: 1120, avgBudget: 7500 },
  
  // Outils & Autres
  { skill: "Git", count: 2870, avgBudget: 6500 },
  { skill: "REST API", count: 2340, avgBudget: 7800 },
  { skill: "GraphQL", count: 1120, avgBudget: 8500 },
  { skill: "WebSockets", count: 780, avgBudget: 8200 },
  { skill: "Microservices", count: 890, avgBudget: 11200 },
  { skill: "Serverless", count: 670, avgBudget: 9800 },
  
  // Marketing Digital
  { skill: "SEO", count: 1560, avgBudget: 5800 },
  { skill: "Google Analytics", count: 1340, avgBudget: 5200 },
  { skill: "Social Media Marketing", count: 1120, avgBudget: 4800 },
  { skill: "Content Marketing", count: 980, avgBudget: 4500 },
  { skill: "Email Marketing", count: 890, avgBudget: 4200 },
  
  // Blockchain
  { skill: "Solidity", count: 670, avgBudget: 15200 },
  { skill: "Web3", count: 780, avgBudget: 14200 },
  { skill: "Smart Contracts", count: 540, avgBudget: 15800 },
  { skill: "Ethereum", count: 450, avgBudget: 14800 }
];

async function insertPopularSkills() {
  try {
    const db = await getDatabase();
    
    // Vérifier si la collection existe déjà
    const collections = await db.listCollections({ name: "popular_skills" }).toArray();
    
    if (collections.length > 0) {
      // Si la collection existe, la vider d'abord
      await db.collection("popular_skills").deleteMany({});
      console.log("✅ Collection popular_skills vidée");
    }
    
    // Insérer les compétences
    const result = await db.collection("popular_skills").insertMany(popularSkills);
    
    console.log(`✅ ${result.insertedCount} compétences insérées avec succès !`);
    console.log("📊 Compétences insérées :");
    
    // Afficher un résumé
    const categories = {
      "Développement Frontend": popularSkills.filter(skill => 
        ["React", "Next.js", "TypeScript", "Vue.js", "Angular", "JavaScript", "HTML/CSS", "Tailwind CSS"].includes(skill.skill)
      ),
      "Développement Backend": popularSkills.filter(skill => 
        ["Node.js", "Python", "Django", "FastAPI", "Java", "Spring Boot", "PHP", "Laravel", "Ruby on Rails", "Express.js"].includes(skill.skill)
      ),
      "AI & Machine Learning": popularSkills.filter(skill => 
        ["Python ML", "TensorFlow", "PyTorch", "OpenAI API", "Computer Vision", "NLP", "Data Science"].includes(skill.skill)
      )
    };
    
    Object.entries(categories).forEach(([category, skills]) => {
      console.log(`\n${category}:`);
      skills.forEach(skill => {
        console.log(`  - ${skill.skill}: ${skill.count} projets, $${skill.avgBudget} budget moyen`);
      });
    });
    
    // Statistiques globales
    const totalProjects = popularSkills.reduce((sum, skill) => sum + skill.count, 0);
    const avgBudgetGlobal = popularSkills.reduce((sum, skill) => sum + skill.avgBudget, 0) / popularSkills.length;
    
    console.log(`\n📈 Statistiques globales:`);
    console.log(`   Total des projets: ${totalProjects}`);
    console.log(`   Budget moyen global: $${Math.round(avgBudgetGlobal)}`);
    console.log(`   Nombre de compétences: ${popularSkills.length}`);
    
  } catch (error) {
    console.error("❌ Erreur lors de l'insertion des compétences:", error);
    process.exit(1);
  }
}

// Exécuter le script
insertPopularSkills().then(() => {
  console.log("\n🎉 Script terminé avec succès !");
  process.exit(0);
});