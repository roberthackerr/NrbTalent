// scripts/seedTestData.js
const { MongoClient, ObjectId } = require('mongodb');
const { faker } = require('@faker-js/faker');

const MONGODB_URI = "mongodb+srv://Nrbtech:(2020)=>{nrbtech};@cluster0.wufkznc.mongodb.net/nrbtalents?retryWrites=true&w=majority&appName=Cluster0"

const client = new MongoClient(MONGODB_URI);

// Compétences organisées par catégorie pour plus de réalisme
const skillsByCategory = {
  'Frontend': ['React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind CSS', 'SASS', 'Next.js', 'Nuxt.js'],
  'Backend': ['Node.js', 'Python', 'Java', 'PHP', 'Ruby', 'Go', 'C#', 'Express.js', 'Django', 'Spring Boot', 'Laravel'],
  'Mobile': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Ionic'],
  'DevOps': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Terraform', 'Ansible', 'Jenkins'],
  'Data': ['Python', 'R', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Machine Learning', 'Data Science', 'TensorFlow'],
  'Design': ['UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Sketch', 'InVision', 'Prototyping'],
  'Marketing': ['SEO', 'Digital Marketing', 'Content Marketing', 'Social Media', 'Google Analytics', 'Email Marketing'],
  'Blockchain': ['Solidity', 'Web3', 'Ethereum', 'Smart Contracts', 'Cryptocurrency'],
  'Testing': ['Jest', 'Cypress', 'Selenium', 'Testing Library', 'JUnit', 'Mocha'],
  'Other': ['Agile', 'Scrum', 'Git', 'REST API', 'GraphQL', 'Microservices', 'WordPress', 'Shopify']
};

// Compétences plates pour sélection aléatoire
const availableSkills = Object.values(skillsByCategory).flat();

// Catégories de projets avec sous-catégories réalistes
const projectCategories = {
  'Web Development': ['Frontend', 'Backend', 'Full Stack', 'E-commerce', 'WordPress', 'API Development'],
  'Mobile Development': ['iOS', 'Android', 'Cross-platform', 'React Native', 'Flutter'],
  'UI/UX Design': ['Web Design', 'Mobile Design', 'User Research', 'Prototyping', 'Design System'],
  'Data Science': ['Machine Learning', 'Data Analysis', 'Data Visualization', 'AI Development'],
  'DevOps': ['Infrastructure', 'CI/CD', 'Cloud Migration', 'Containerization'],
  'Marketing': ['SEO', 'Social Media', 'Content Strategy', 'Digital Campaign'],
  'Blockchain': ['Smart Contracts', 'DApp Development', 'NFT Platform', 'DeFi']
};

// Spécialisations par région pour plus de réalisme
const regionalSpecializations = {
  'Europe': ['React', 'Node.js', 'Python', 'AWS', 'UI/UX Design'],
  'North America': ['JavaScript', 'Python', 'React Native', 'Machine Learning', 'DevOps'],
  'Asia': ['Java', 'PHP', 'Mobile Development', 'WordPress', 'SEO'],
  'Africa': ['PHP', 'JavaScript', 'WordPress', 'Digital Marketing', 'Mobile Development'],
  'South America': ['JavaScript', 'Python', 'React', 'Node.js', 'UI/UX Design']
};

// Niveaux d'expérience avec salaires réalistes
const experienceLevels = [
  { level: 'junior', minRate: 25, maxRate: 50, minProjects: 0, maxProjects: 10 },
  { level: 'mid', minRate: 45, maxRate: 80, minProjects: 5, maxProjects: 25 },
  { level: 'senior', minRate: 70, maxRate: 120, minProjects: 15, maxProjects: 40 },
  { level: 'expert', minRate: 100, maxRate: 200, minProjects: 30, maxProjects: 50 }
];

// Complexités de projet avec budgets réalistes
const projectComplexities = {
  'simple': { minBudget: 500, maxBudget: 2000, timeline: '1-2 weeks' },
  'moderate': { minBudget: 1500, maxBudget: 5000, timeline: '2-4 weeks' },
  'complex': { minBudget: 4000, maxBudget: 15000, timeline: '1-3 months' },
  'very-complex': { minBudget: 10000, maxBudget: 50000, timeline: '3-6 months' }
};

// Industries clients réalistes
const clientIndustries = [
  'Technologie', 'Finance', 'Santé', 'E-commerce', 'Education', 
  'Immobilier', 'Media', 'Transport', 'Energy', 'Agriculture'
];

async function seedDatabase() {
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db();
    
    // VÉRIFICATION des données existantes
    console.log('🔍 Vérification des données existantes...');
    
    const existingFreelancers = await db.collection('users').countDocuments({ 
      role: 'freelancer' 
    });
    const existingProjects = await db.collection('projects').countDocuments();
    
    console.log(`📊 Données existantes:`);
    console.log(`   - ${existingFreelancers} freelancers`);
    console.log(`   - ${existingProjects} projets`);
    
    // STRATÉGIE : Ajouter seulement si nécessaire
    const targetFreelancerCount = 80;
    const targetProjectCount = 50;
    
    const freelancersToAdd = Math.max(0, targetFreelancerCount - existingFreelancers);
    const projectsToAdd = Math.max(0, targetProjectCount - existingProjects);
    
    console.log(`🎯 Objectifs:`);
    console.log(`   - À ajouter: ${freelancersToAdd} freelancers, ${projectsToAdd} projets`);
    
    // Générer seulement le nécessaire
    if (freelancersToAdd > 0) {
      console.log('👨‍💻 Génération de nouveaux freelancers...');
      const newFreelancers = await generateFreelancers(freelancersToAdd);
      await db.collection('users').insertMany(newFreelancers);
      console.log(`✅ ${newFreelancers.length} nouveaux freelancers ajoutés`);
    }
    
    if (projectsToAdd > 0) {
      console.log('🚀 Génération de nouveaux projets...');
      const newProjects = await generateProjects(projectsToAdd);
      await db.collection('projects').insertMany(newProjects);
      console.log(`✅ ${newProjects.length} nouveaux projets ajoutés`);
    }
    
    // Statistiques finales
    const finalFreelancers = await db.collection('users').countDocuments({ role: 'freelancer' });
    const finalProjects = await db.collection('projects').countDocuments();
    
    console.log('🎉 Base de données mise à jour avec succès !');
    console.log('📊 Statistiques finales:');
    console.log(`   - ${finalFreelancers} freelancers au total`);
    console.log(`   - ${finalProjects} projets au total`);
    console.log(`   - Compétences couvertes: ${availableSkills.length} technologies`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
  }
}

// Générer des freelancers réalistes avec spécialisations
async function generateFreelancers(count) {
  const freelancers = [];
  const regions = Object.keys(regionalSpecializations);
  
  for (let i = 0; i < count; i++) {
    const region = faker.helpers.arrayElement(regions);
    const regionalSkills = regionalSpecializations[region];
    const experienceLevel = faker.helpers.arrayElement(experienceLevels);
    
    // Compétences basées sur la région et le niveau d'expérience
    const coreSkills = faker.helpers.arrayElements(regionalSkills, faker.number.int({ min: 2, max: 4 }));
    const additionalSkills = faker.helpers.arrayElements(
      availableSkills.filter(skill => !coreSkills.includes(skill)), 
      faker.number.int({ min: 1, max: 3 })
    );
    const skills = [...coreSkills, ...additionalSkills];
    
    const freelancer = {
      _id: new ObjectId(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '$2b$10$5.D3boXFV2C74ViVPjJ1B.nbnLuLVU0r0zSZ6rbmugMTmKGME/ZTu',
      role: 'freelancer',
      title: generateJobTitle(skills, experienceLevel.level),
      bio: generateBio(skills, experienceLevel.level),
      skills: skills,
      experience: generateRealisticExperience(experienceLevel, skills),
      languages: getRealisticLanguages(region),
      location: generateLocation(region),
      hourlyRate: faker.number.int({ 
        min: experienceLevel.minRate, 
        max: experienceLevel.maxRate 
      }),
      availability: generateAvailability(experienceLevel.level),
      createdAt: faker.date.past({ years: 3 }),
      updatedAt: new Date(),
      verified: faker.datatype.boolean(0.8),
      isActive: faker.datatype.boolean(0.9),
      avatar: faker.image.avatar(),
      statistics: generateRealisticStatistics(experienceLevel),
      portfolio: generatePortfolioItems(faker.number.int({ min: 2, max: 6 }), skills),
      reviews: generateRealisticReviews(experienceLevel),
      badges: generateRealisticBadges(experienceLevel),
      preferredProjectTypes: generatePreferredProjectTypes(skills),
      education: generateEducationBackground(),
      certifications: generateCertifications(skills)
    };
    
    freelancers.push(freelancer);
  }
  
  return freelancers;
}

// Générer des projets variés avec budgets réalistes
async function generateProjects(count) {
  const projects = [];
  
  // Récupérer l'ID du client existant (Roberto)
  const db = client.db();
  const existingClient = await db.collection('users').findOne({ 
    _id: new ObjectId("68e612f19cab227b80009db2") 
  });
  
  const clientId = existingClient ? existingClient._id : new ObjectId("68e612f19cab227b80009db2");
  
  console.log(`👤 Utilisation du client: ${existingClient ? existingClient.name : 'Roberto'}`);
  
  for (let i = 0; i < count; i++) {
    const category = faker.helpers.arrayElement(Object.keys(projectCategories));
    const subcategory = faker.helpers.arrayElement(projectCategories[category]);
    const complexity = faker.helpers.arrayElement(Object.keys(projectComplexities));
    const budgetRange = projectComplexities[complexity];
    
    const requiredSkills = generateProjectSkills(category, subcategory);
    const preferredSkills = faker.helpers.arrayElements(
      availableSkills.filter(skill => !requiredSkills.includes(skill)),
      faker.number.int({ min: 1, max: 3 })
    );
    
    const project = {
      _id: new ObjectId(),
      title: generateProjectTitle(category, subcategory),
      description: generateProjectDescription(category, subcategory),
      category: category,
      subcategory: subcategory,
      budget: {
        min: faker.number.int({ min: budgetRange.minBudget, max: budgetRange.maxBudget * 0.7 }),
        max: faker.number.int({ min: budgetRange.minBudget * 1.3, max: budgetRange.maxBudget }),
        type: faker.helpers.arrayElement(['fixed', 'hourly']),
        currency: 'USD'
      },
      skills: requiredSkills,
      preferredSkills: preferredSkills,
      niceToHave: faker.helpers.arrayElements(
        availableSkills.filter(skill => ![...requiredSkills, ...preferredSkills].includes(skill)),
        faker.number.int({ min: 1, max: 3 })
      ),
      deadline: faker.date.future({ years: 2 }),
      visibility: 'public',
      tags: generateProjectTags(category, complexity),
      status: generateProjectStatus(),
      clientId: clientId,
      applications: [],
      applicationCount: 0,
      freelancerId: null,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: new Date(),
      views: faker.number.int({ min: 50, max: 2000 }),
      featured: faker.datatype.boolean(0.15),
      urgency: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
      complexity: complexity,
      saveCount: faker.number.int({ min: 0, max: 100 }),
      milestones: generateRealisticMilestones(budgetRange),
      projectDuration: budgetRange.timeline,
      teamSize: faker.number.int({ min: 1, max: 5 }),
      clientIndustry: generateClientIndustry()
    };
    
    projects.push(project);
  }
  
  return projects;
}

// FONCTIONS HELPER MANQUANTES

function generatePortfolioItems(count, skills) {
  const items = [];
  const projectTypes = ['Application Web', 'Site E-commerce', 'API REST', 'Application Mobile', 'Dashboard', 'Système de Gestion'];
  
  for (let i = 0; i < count; i++) {
    const projectSkills = faker.helpers.arrayElements(skills, faker.number.int({ min: 2, max: 5 }));
    
    items.push({
      title: `${faker.helpers.arrayElement(['Développement', 'Conception', 'Refonte'])} ${faker.helpers.arrayElement(projectTypes)}`,
      description: faker.lorem.paragraphs(2),
      image: faker.image.url(),
      url: faker.internet.url(),
      technologies: projectSkills,
      completionDate: faker.date.past({ years: 2 }),
      client: faker.company.name(),
      projectType: faker.helpers.arrayElement(['Freelance', 'Client', 'Personnel']),
      results: generateProjectResults(projectSkills)
    });
  }
  
  return items;
}

function generateProjectResults(skills) {
  const results = [
    `Augmentation des performances de ${faker.number.int({ min: 30, max: 80 })}%`,
    `Réduction des temps de chargement de ${faker.number.int({ min: 40, max: 70 })}%`,
    `Amélioration de l'expérience utilisateur avec ${faker.number.int({ min: 20, max: 50 })}% de satisfaction en plus`,
    `Augmentation du trafic de ${faker.number.int({ min: 50, max: 200 })}%`,
    `Optimisation du SEO avec ${faker.number.int({ min: 3, max: 15 })} positions gagnées`
  ];
  
  return faker.helpers.arrayElements(results, faker.number.int({ min: 1, max: 3 }));
}

function generatePreferredProjectTypes(skills) {
  const types = ['Web Development', 'Mobile Development', 'UI/UX Design', 'Data Science', 'DevOps', 'Marketing'];
  return faker.helpers.arrayElements(types, faker.number.int({ min: 1, max: 3 }));
}

function generateEducationBackground() {
  const degrees = ['Bachelor en Informatique', 'Master en Génie Logiciel', 'Bootcamp Développement Web', 'Diplôme en Design', 'Certification Technique'];
  const schools = ['Université Paris-Saclay', 'École 42', 'OpenClassrooms', 'Stanford University', 'MIT', 'General Assembly'];
  
  return [{
    degree: faker.helpers.arrayElement(degrees),
    school: faker.helpers.arrayElement(schools),
    field: 'Informatique',
    startDate: faker.date.past({ years: 8 }),
    endDate: faker.date.past({ years: 4 }),
    description: faker.lorem.sentence()
  }];
}

function generateCertifications(skills) {
  const certs = [
    'AWS Certified Developer',
    'Google Cloud Professional',
    'React Certified Developer',
    'Scrum Master Certified',
    'Microsoft Azure Fundamentals',
    'Docker Certified Associate',
    'Kubernetes Application Developer'
  ];
  
  return faker.helpers.arrayElements(certs, faker.number.int({ min: 0, max: 3 })).map(cert => ({
    name: cert,
    issuer: faker.company.name(),
    date: faker.date.past({ years: 3 }),
    expiryDate: faker.date.future({ years: 2 })
  }));
}

function generateRealisticMilestones(budgetRange) {
  const phases = [
    { title: "Phase 1: Analyse et Conception", percentage: 0.2 },
    { title: "Phase 2: Développement Frontend", percentage: 0.3 },
    { title: "Phase 3: Développement Backend", percentage: 0.3 },
    { title: "Phase 4: Tests et Déploiement", percentage: 0.2 }
  ];
  
  return phases.map(phase => ({
    title: phase.title,
    amount: Math.round((budgetRange.maxBudget * phase.percentage) / 100) * 100,
    dueDate: faker.date.future({ years: 1 }),
    description: `${phase.title} - Livrables et validation`,
    status: "pending",
    completedAt: null
  }));
}

function generateClientIndustry() {
  return faker.helpers.arrayElement(clientIndustries);
}

// scripts/seedTestData.js - CORRECTION

function generateProjectStatus() {
  const weights = [
    { value: 'open', weight: 0.6 },      // 60% de projets ouverts
    { value: 'draft', weight: 0.2 },     // 20% brouillons  
    { value: 'paused', weight: 0.1 },    // 10% en pause
    { value: 'in-progress', weight: 0.1 } // 10% en cours
  ];
  
  return faker.helpers.weightedArrayElement(weights);
}

// Les autres fonctions existantes (generateJobTitle, generateBio, etc.) restent identiques
function generateJobTitle(skills, experienceLevel) {
  const domains = {
    'Frontend': ['Frontend Developer', 'UI Developer', 'JavaScript Engineer'],
    'Backend': ['Backend Developer', 'API Specialist', 'Server Engineer'],
    'Mobile': ['Mobile Developer', 'App Developer', 'iOS/Android Engineer'],
    'Design': ['UI/UX Designer', 'Product Designer', 'UX Researcher'],
    'Data': ['Data Scientist', 'ML Engineer', 'Data Analyst'],
    'DevOps': ['DevOps Engineer', 'Cloud Architect', 'Infrastructure Specialist']
  };
  
  const primarySkill = skills[0];
  let domain = 'Full Stack Developer';
  
  for (const [key, values] of Object.entries(skillsByCategory)) {
    if (values.includes(primarySkill)) {
      domain = key;
      break;
    }
  }
  
  const titles = domains[domain] || ['Software Engineer', 'Technical Consultant'];
  const levelPrefix = experienceLevel === 'junior' ? 'Junior ' : 
                     experienceLevel === 'senior' ? 'Senior ' : 
                     experienceLevel === 'expert' ? 'Lead ' : '';
  
  return levelPrefix + faker.helpers.arrayElement(titles);
}

function generateBio(skills, experienceLevel) {
  const years = experienceLevel === 'junior' ? '1-3' :
                experienceLevel === 'mid' ? '3-5' :
                experienceLevel === 'senior' ? '5-8' : '8+';
  
  const specialties = skills.slice(0, 3).join(', ');
  
  return `Développeur passionné avec ${years} ans d'expérience, spécialisé en ${specialties}. J'aime résoudre des problèmes complexes et créer des solutions innovantes. J'ai travaillé sur divers projets allant des startups aux entreprises établies. Toujours à la recherche de nouveaux défis techniques et opportunités de croissance.`;
}

function generateRealisticExperience(experienceLevel, skills) {
  const experiences = [];
  const totalYears = experienceLevel.level === 'junior' ? faker.number.int({ min: 1, max: 3 }) :
                    experienceLevel.level === 'mid' ? faker.number.int({ min: 3, max: 6 }) :
                    experienceLevel.level === 'senior' ? faker.number.int({ min: 6, max: 10 }) :
                    faker.number.int({ min: 10, max: 15 });
  
  let currentDate = new Date();
  
  for (let i = 0; i < faker.number.int({ min: 2, max: 5 }); i++) {
    const duration = faker.number.int({ min: 1, max: Math.min(4, totalYears) });
    const startDate = faker.date.past({ years: totalYears });
    const endDate = i === 0 ? null : new Date(startDate.getTime() + duration * 365 * 24 * 60 * 60 * 1000);
    
    const roleSkills = faker.helpers.arrayElements(skills, faker.number.int({ min: 3, max: 6 }));
    
    experiences.push({
      company: faker.company.name(),
      position: faker.person.jobTitle(),
      startDate: startDate,
      endDate: endDate,
      current: i === 0,
      description: `Responsable du développement ${faker.helpers.arrayElement(['frontend', 'backend', 'mobile', 'full-stack'])} utilisant ${roleSkills.slice(0, 3).join(', ')}. Gestion de projet agile et collaboration avec les équipes cross-fonctionnelles.`,
      technologies: roleSkills,
      achievements: generateAchievements(roleSkills)
    });
  }
  
  return experiences;
}

function generateAchievements(skills) {
  const achievements = [
    `Développement d'une application ${faker.helpers.arrayElement(['web', 'mobile'])} utilisant ${skills[0]}`,
    `Optimisation des performances réduisant les temps de chargement de ${faker.number.int({ min: 30, max: 80 })}%`,
    `Mise en place d'un système ${faker.helpers.arrayElement(['CI/CD', 'de monitoring', 'de caching'])}`,
    `Refonte de l'architecture améliorant la scalabilité`,
    `Formation et mentorat de ${faker.number.int({ min: 2, max: 5 })} développeurs juniors`
  ];
  
  return faker.helpers.arrayElements(achievements, faker.number.int({ min: 2, max: 4 }));
}

function generateRealisticStatistics(experienceLevel) {
  const baseSuccessRate = experienceLevel.level === 'junior' ? 75 :
                         experienceLevel.level === 'mid' ? 85 :
                         experienceLevel.level === 'senior' ? 90 : 95;
  
  const completedProjects = faker.number.int({ 
    min: experienceLevel.minProjects, 
    max: experienceLevel.maxProjects 
  });
  
  return {
    completedProjects: completedProjects,
    successRate: baseSuccessRate,
    onTimeDelivery: faker.number.int({ min: baseSuccessRate - 10, max: baseSuccessRate }),
    clientSatisfaction: faker.number.int({ min: 80, max: 100 }),
    responseRate: faker.number.int({ min: 85, max: 100 }),
    avgResponseTime: faker.number.int({ min: 1, max: experienceLevel.level === 'expert' ? 4 : 12 }),
    totalHoursWorked: completedProjects * faker.number.int({ min: 40, max: 200 }),
    repeatClientRate: faker.number.int({ min: 20, max: experienceLevel.level === 'expert' ? 80 : 50 }),
    earnings: {
      total: completedProjects * faker.number.int({ min: 500, max: 5000 }),
      thisMonth: faker.number.int({ min: 0, max: 5000 }),
      lastMonth: faker.number.int({ min: 0, max: 5000 })
    },
    profileViews: faker.number.int({ min: 100, max: 5000 }),
    proposalAcceptanceRate: faker.number.int({ min: 40, max: 90 })
  };
}

function generateRealisticReviews(experienceLevel) {
  const reviewCount = experienceLevel.level === 'junior' ? faker.number.int({ min: 0, max: 5 }) :
                     experienceLevel.level === 'mid' ? faker.number.int({ min: 3, max: 10 }) :
                     experienceLevel.level === 'senior' ? faker.number.int({ min: 8, max: 20 }) :
                     faker.number.int({ min: 15, max: 30 });
  
  const reviews = [];
  const positiveComments = [
    "Travail exceptionnel, livré dans les délais",
    "Communication excellente tout au long du projet",
    "Expertise technique impressionnante",
    "Solution créative à un problème complexe",
    "Recommandé sans hésitation",
    "Professionnel et fiable"
  ];
  
  const neutralComments = [
    "Bon travail dans l'ensemble",
    "Quelques retards mineurs mais bon résultat final",
    "Compétences techniques solides",
    "Satisfait du travail fourni"
  ];
  
  for (let i = 0; i < reviewCount; i++) {
    const isPositive = faker.datatype.boolean(0.8);
    const comments = isPositive ? positiveComments : neutralComments;
    
    reviews.push({
      clientName: faker.person.fullName(),
      rating: isPositive ? faker.number.int({ min: 4, max: 5 }) : faker.number.int({ min: 3, max: 4 }),
      comment: faker.helpers.arrayElement(comments),
      project: faker.lorem.words(3),
      date: faker.date.past({ years: 2 }),
      wouldRecommend: isPositive
    });
  }
  
  return reviews;
}

function generateRealisticBadges(experienceLevel) {
  const allBadges = [
    'Top Rated', 'Rising Talent', 'Verified', 'Fast Responder',
    'On-Time Delivery', 'Client Favorite', 'Expert Vetted',
    'Quality Work', 'Great Communicator', 'Highly Skilled'
  ];
  
  const badgeCount = experienceLevel.level === 'junior' ? faker.number.int({ min: 0, max: 2 }) :
                    experienceLevel.level === 'mid' ? faker.number.int({ min: 1, max: 3 }) :
                    experienceLevel.level === 'senior' ? faker.number.int({ min: 2, max: 4 }) :
                    faker.number.int({ min: 3, max: 5 });
  
  return faker.helpers.arrayElements(allBadges, badgeCount);
}

function generateProjectSkills(category, subcategory) {
  const categorySkills = {
    'Web Development': ['JavaScript', 'React', 'Node.js', 'HTML/CSS'],
    'Mobile Development': ['React Native', 'Flutter', 'iOS', 'Android'],
    'UI/UX Design': ['Figma', 'UI/UX Design', 'Adobe XD', 'Prototyping'],
    'Data Science': ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
    'DevOps': ['Docker', 'AWS', 'CI/CD', 'Kubernetes'],
    'Marketing': ['SEO', 'Digital Marketing', 'Content Marketing', 'Google Analytics'],
    'Blockchain': ['Solidity', 'Web3', 'Ethereum', 'Smart Contracts']
  };
  
  const baseSkills = categorySkills[category] || ['JavaScript', 'Node.js', 'React'];
  const additionalSkills = faker.helpers.arrayElements(
    availableSkills.filter(skill => !baseSkills.includes(skill)),
    faker.number.int({ min: 1, max: 3 })
  );
  
  return [...baseSkills, ...additionalSkills];
}

function generateProjectTitle(category, subcategory) {
  const verbs = ['Développement', 'Création', 'Refonte', 'Optimisation', 'Migration', 'Implémentation'];
  const adjectives = ['Moderne', 'Innovant', 'Scalable', 'Performant', 'Responsive', 'Sécurisé'];
  
  return `${faker.helpers.arrayElement(verbs)} d'un${faker.helpers.arrayElement(['e', ''])} ${faker.helpers.arrayElement(adjectives)} ${subcategory} ${category}`;
}

function generateProjectDescription(category, subcategory) {
  const templates = {
    'Web Development': `Nous recherchons un développeur talentueux pour créer une application web ${subcategory} moderne et performante. Le projet implique le développement d'une interface utilisateur réactive et d'une API robuste.`,
    'Mobile Development': `Développement d'une application mobile ${subcategory} pour iOS et Android. L'application devra offrir une expérience utilisateur fluide et des performances optimales.`,
    'UI/UX Design': `Conception d'une interface utilisateur intuitive et moderne pour une application ${subcategory}. Recherche utilisateur, prototypage et design system inclus.`,
    'Data Science': `Analyse de données et développement de modèles de machine learning pour ${subcategory}. Nettoyage des données, feature engineering et déploiement de modèles.`,
    'DevOps': `Mise en place d'une infrastructure cloud et pipeline CI/CD pour ${subcategory}. Automatisation des déploiements et monitoring des performances.`
  };
  
  return templates[category] || `Projet de ${category} spécialisé en ${subcategory}. Nous cherchons un expert pour nous aider à concrétiser notre vision.`;
}

function generateProjectTags(category, complexity) {
  const baseTags = [complexity, category.toLowerCase()];
  const additionalTags = ['urgent', 'featured', 'long-term', 'short-term', 'remote', 'team'];
  
  return [...baseTags, ...faker.helpers.arrayElements(additionalTags, faker.number.int({ min: 1, max: 3 }))];
}

function getRealisticLanguages(region) {
  const regionalLanguages = {
    'Europe': ['French', 'English', 'German', 'Spanish'],
    'North America': ['English', 'Spanish', 'French'],
    'Asia': ['English', 'Mandarin', 'Hindi', 'Japanese'],
    'Africa': ['French', 'English', 'Arabic', 'Swahili'],
    'South America': ['Spanish', 'Portuguese', 'English']
  };
  
  return faker.helpers.arrayElements(regionalLanguages[region], faker.number.int({ min: 1, max: 3 }));
}

function generateLocation(region) {
  const cities = {
    'Europe': ['Paris, France', 'Berlin, Germany', 'London, UK', 'Barcelona, Spain', 'Amsterdam, Netherlands'],
    'North America': ['New York, USA', 'San Francisco, USA', 'Toronto, Canada', 'Vancouver, Canada'],
    'Asia': ['Bangalore, India', 'Singapore', 'Tokyo, Japan', 'Seoul, South Korea'],
    'Africa': ['Lagos, Nigeria', 'Nairobi, Kenya', 'Cairo, Egypt', 'Johannesburg, South Africa'],
    'South America': ['São Paulo, Brazil', 'Buenos Aires, Argentina', 'Lima, Peru', 'Bogotá, Colombia']
  };
  
  return faker.helpers.arrayElement(cities[region]);
}

function generateAvailability(experienceLevel) {
  const options = {
    'junior': ['full-time', 'part-time'],
    'mid': ['full-time', 'part-time', 'flexible'],
    'senior': ['full-time', 'flexible'],
    'expert': ['flexible', 'part-time']
  };
  
  return faker.helpers.arrayElement(options[experienceLevel]);
}

// Exécuter le script
seedDatabase();