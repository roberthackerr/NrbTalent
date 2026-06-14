  // app/[lang]/games/combat/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Swords, Shield, Heart, Zap, Skull, Trophy, 
  RefreshCw, Sword, Users, Sparkles, TrendingUp,
  Star, Crown, Target, Wind, Flame, Shield as ShieldIcon
} from 'lucide-react'

// Types
interface Character {
  id: string
  name: string
  avatar: string
  health: number
  maxHealth: number
  mana: number
  maxMana: number
  attack: number
  defense: number
  speed: number
  level: number
  experience: number
  skills: Skill[]
  element: 'fire' | 'water' | 'earth' | 'wind' | 'lightning'
  wins: number
  losses: number
}

interface Skill {
  id: string
  name: string
  description: string
  damage: number
  manaCost: number
  cooldown: number
  currentCooldown: number
  type: 'physical' | 'magical' | 'heal' | 'buff'
  icon: any
  effect?: string
}

interface BattleLog {
  id: number
  message: string
  type: 'damage' | 'heal' | 'critical' | 'miss' | 'info' | 'victory'
  timestamp: Date
}

// Personnages disponibles
const AVAILABLE_CHARACTERS: Character[] = [
  {
    id: 'warrior',
    name: 'Guerrier Draconique',
    avatar: '⚔️',
    health: 450,
    maxHealth: 450,
    mana: 100,
    maxMana: 100,
    attack: 85,
    defense: 70,
    speed: 60,
    level: 1,
    experience: 0,
    element: 'fire',
    wins: 0,
    losses: 0,
    skills: [
      {
        id: 'slash',
        name: 'Lame Ardente',
        description: 'Attaque puissante qui inflige des dégâts de feu',
        damage: 65,
        manaCost: 15,
        cooldown: 0,
        currentCooldown: 0,
        type: 'physical',
        icon: Sword
      },
      {
        id: 'shield',
        name: 'Bouclier Protecteur',
        description: 'Augmente la défense pour 2 tours',
        damage: 0,
        manaCost: 20,
        cooldown: 3,
        currentCooldown: 0,
        type: 'buff',
        icon: Shield
      }
    ]
  },
  {
    id: 'mage',
    name: 'Archimage Éthéré',
    avatar: '🔮',
    health: 320,
    maxHealth: 320,
    mana: 200,
    maxMana: 200,
    attack: 95,
    defense: 40,
    speed: 75,
    level: 1,
    experience: 0,
    element: 'lightning',
    wins: 0,
    losses: 0,
    skills: [
      {
        id: 'fireball',
        name: 'Boule de Foudre',
        description: 'Projectile magique dévastateur',
        damage: 80,
        manaCost: 25,
        cooldown: 0,
        currentCooldown: 0,
        type: 'magical',
        icon: Zap
      },
      {
        id: 'heal',
        name: 'Soins Mystiques',
        description: 'Restaure 50 PV',
        damage: -50,
        manaCost: 30,
        cooldown: 2,
        currentCooldown: 0,
        type: 'heal',
        icon: Heart
      }
    ]
  },
  {
    id: 'assassin',
    name: 'Ombre Mortelle',
    avatar: '🗡️',
    health: 280,
    maxHealth: 280,
    mana: 120,
    maxMana: 120,
    attack: 100,
    defense: 35,
    speed: 95,
    level: 1,
    experience: 0,
    element: 'wind',
    wins: 0,
    losses: 0,
    skills: [
      {
        id: 'stab',
        name: 'Dague Empoisonnée',
        description: 'Attaque critique avec poison',
        damage: 70,
        manaCost: 15,
        cooldown: 0,
        currentCooldown: 0,
        type: 'physical',
        icon: Swords
      },
      {
        id: 'dodge',
        name: 'Esquive Mortelle',
        description: 'Esquive la prochaine attaque',
        damage: 0,
        manaCost: 20,
        cooldown: 3,
        currentCooldown: 0,
        type: 'buff',
        icon: Wind
      }
    ]
  }
]

// Ennemi aléatoire
const generateEnemy = (playerLevel: number): Character => {
  const enemyTypes = [
    { name: 'Gobelins Sauvages', avatar: '👹', attack: 60, defense: 45, health: 250, element: 'earth' as const },
    { name: 'Chevalier Noir', avatar: '🗡️', attack: 75, defense: 60, health: 350, element: 'fire' as const },
    { name: 'Dragonnet', avatar: '🐉', attack: 80, defense: 50, health: 300, element: 'fire' as const },
    { name: 'Esprit Maléfique', avatar: '👻', attack: 70, defense: 35, health: 220, element: 'wind' as const },
    { name: 'Golem de Roc', avatar: '🗿', attack: 55, defense: 80, health: 400, element: 'earth' as const }
  ]
  
  const enemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]
  
  return {
    id: `enemy_${Date.now()}`,
    name: enemy.name,
    avatar: enemy.avatar,
    health: enemy.health + (playerLevel - 1) * 20,
    maxHealth: enemy.health + (playerLevel - 1) * 20,
    mana: 80,
    maxMana: 80,
    attack: enemy.attack + (playerLevel - 1) * 5,
    defense: enemy.defense + (playerLevel - 1) * 3,
    speed: 50 + Math.random() * 20,
    level: playerLevel,
    experience: 0,
    element: enemy.element,
    wins: 0,
    losses: 0,
    skills: [
      {
        id: 'enemy_attack',
        name: 'Attaque Sauvage',
        description: 'Attaque physique brutale',
        damage: 45,
        manaCost: 0,
        cooldown: 0,
        currentCooldown: 0,
        type: 'physical',
        icon: Swords
      }
    ]
  }
}

export default function CombatGamePage() {
  const [player, setPlayer] = useState<Character>(AVAILABLE_CHARACTERS[0])
  const [enemy, setEnemy] = useState<Character | null>(null)
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [battleEnded, setBattleEnded] = useState(false)
  const [battleResult, setBattleResult] = useState<'victory' | 'defeat' | null>(null)
  const [animating, setAnimating] = useState(false)
  const [showSkillEffect, setShowSkillEffect] = useState(false)
  const [playerHealthBarWidth, setPlayerHealthBarWidth] = useState(100)
  const [enemyHealthBarWidth, setEnemyHealthBarWidth] = useState(100)

  // Initialiser le combat
  useEffect(() => {
    startNewBattle()
  }, [])

  // Mettre à jour les barres de vie
  useEffect(() => {
    if (player) {
      setPlayerHealthBarWidth((player.health / player.maxHealth) * 100)
    }
    if (enemy) {
      setEnemyHealthBarWidth((enemy.health / enemy.maxHealth) * 100)
    }
  }, [player?.health, enemy?.health])

  const startNewBattle = () => {
    const newEnemy = generateEnemy(player.level)
    setEnemy(newEnemy)
    setBattleLogs([])
    setIsPlayerTurn(true)
    setBattleEnded(false)
    setBattleResult(null)
    setSelectedSkill(null)
    addBattleLog(`⚔️ Combat contre ${newEnemy.name} commence !`, 'info')
    addBattleLog(`✨ ${player.name} vs ${newEnemy.name}`, 'info')
  }

  const addBattleLog = (message: string, type: BattleLog['type']) => {
    setBattleLogs(prev => [...prev, {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    }])
  }

  const calculateDamage = (attacker: Character, defender: Character, skill: Skill): number => {
    let baseDamage = skill.damage + attacker.attack * 0.5 - defender.defense * 0.3
    baseDamage = Math.max(10, baseDamage)
    
    // Critique (15% de chance)
    const isCritical = Math.random() < 0.15
    if (isCritical) {
      baseDamage *= 1.5
      addBattleLog(`💥 Coup critique !`, 'critical')
    }
    
    // Élément (avantage)
    const elementAdvantage: Record<string, Record<string, number>> = {
      fire: { wind: 1.2, water: 0.8 },
      water: { fire: 1.2, earth: 0.8 },
      earth: { lightning: 1.2, wind: 0.8 },
      wind: { earth: 1.2, fire: 0.8 },
      lightning: { water: 1.2, earth: 0.8 }
    }
    
    const advantage = elementAdvantage[attacker.element]?.[defender.element] || 1
    if (advantage > 1) {
      baseDamage *= advantage
      addBattleLog(`✨ Avantage élémentaire !`, 'info')
    } else if (advantage < 1) {
      baseDamage *= advantage
      addBattleLog(`⚠️ Désavantage élémentaire...`, 'info')
    }
    
    return Math.floor(baseDamage)
  }

  const performSkill = (skill: Skill) => {
    if (!enemy || battleEnded || !isPlayerTurn || animating) return
    
    // Vérifier mana
    if (player.mana < skill.manaCost) {
      addBattleLog(`❌ Pas assez de mana pour ${skill.name}!`, 'info')
      return
    }
    
    // Vérifier cooldown
    if (skill.currentCooldown > 0) {
      addBattleLog(`⏳ ${skill.name} est en recharge (${skill.currentCooldown} tours)`, 'info')
      return
    }
    
    setAnimating(true)
    setShowSkillEffect(true)
    
    setTimeout(() => {
      if (skill.type === 'heal') {
        // Soin
        const healAmount = Math.abs(skill.damage)
        const newHealth = Math.min(player.maxHealth, player.health + healAmount)
        setPlayer(prev => ({ ...prev, health: newHealth, mana: prev.mana - skill.manaCost }))
        addBattleLog(`💚 ${player.name} utilise ${skill.name} et récupère ${healAmount} PV!`, 'heal')
      } else if (skill.type === 'buff') {
        // Buff (à implémenter)
        addBattleLog(`✨ ${player.name} utilise ${skill.name}! Effet spécial activé!`, 'info')
        setPlayer(prev => ({ ...prev, mana: prev.mana - skill.manaCost }))
      } else {
        // Attaque
        const damage = calculateDamage(player, enemy, skill)
        const newEnemyHealth = Math.max(0, enemy.health - damage)
        setEnemy(prev => prev ? { ...prev, health: newEnemyHealth } : null)
        addBattleLog(`⚔️ ${player.name} inflige ${damage} dégâts avec ${skill.name}!`, 'damage')
        setPlayer(prev => ({ ...prev, mana: prev.mana - skill.manaCost }))
      }
      
      // Mettre à jour cooldowns
      setPlayer(prev => ({
        ...prev,
        skills: prev.skills.map(s => ({
          ...s,
          currentCooldown: s.currentCooldown > 0 ? s.currentCooldown - 1 : 0
        }))
      }))
      
      setShowSkillEffect(false)
      setAnimating(false)
      
      // Vérifier si l'ennemi est mort
      if (enemy && enemy.health <= 0) {
        handleVictory()
      } else {
        setIsPlayerTurn(false)
        setTimeout(() => enemyTurn(), 1000)
      }
    }, 500)
  }

  const enemyTurn = () => {
    if (!enemy || battleEnded) return
    
    setAnimating(true)
    
    setTimeout(() => {
      const enemySkill = enemy.skills[0]
      const damage = calculateDamage(enemy, player, enemySkill)
      const newPlayerHealth = Math.max(0, player.health - damage)
      setPlayer(prev => ({ ...prev, health: newPlayerHealth }))
      addBattleLog(`💢 ${enemy.name} attaque et inflige ${damage} dégâts!`, 'damage')
      
      setAnimating(false)
      
      if (newPlayerHealth <= 0) {
        handleDefeat()
      } else {
        setIsPlayerTurn(true)
      }
    }, 800)
  }

  const handleVictory = () => {
    setBattleEnded(true)
    setBattleResult('victory')
    const expGain = 100 + enemy!.level * 20
    const goldGain = 50 + enemy!.level * 10
    
    addBattleLog(`🎉 Victoire! +${expGain} XP`, 'victory')
    addBattleLog(`💰 +${goldGain} pièces d'or`, 'victory')
    
    setPlayer(prev => ({
      ...prev,
      experience: prev.experience + expGain,
      wins: prev.wins + 1,
      health: prev.maxHealth,
      mana: prev.maxMana
    }))
  }

  const handleDefeat = () => {
    setBattleEnded(true)
    setBattleResult('defeat')
    addBattleLog(`💀 Défaite... ${player.name} a été vaincu!`, 'victory')
    setPlayer(prev => ({
      ...prev,
      losses: prev.losses + 1,
      health: prev.maxHealth,
      mana: prev.maxMana
    }))
  }

  const getElementColor = (element: string) => {
    const colors = {
      fire: 'from-red-500 to-orange-500',
      water: 'from-blue-500 to-cyan-500',
      earth: 'from-green-500 to-emerald-500',
      wind: 'from-teal-500 to-green-500',
      lightning: 'from-yellow-500 to-amber-500'
    }
    return colors[element as keyof typeof colors] || 'from-gray-500 to-slate-500'
  }

  if (!enemy) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8 px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500 bg-clip-text text-transparent mb-2">
            Combat Arène
          </h1>
          <p className="text-gray-400">Affrontez des ennemis puissants et devenez une légende!</p>
        </div>

        {/* Stats du joueur */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Trophy className="h-5 w-5" />
              <span className="text-sm font-semibold">Victoires</span>
            </div>
            <p className="text-2xl font-bold text-white">{player.wins}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <Skull className="h-5 w-5" />
              <span className="text-sm font-semibold">Défaites</span>
            </div>
            <p className="text-2xl font-bold text-white">{player.losses}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold">Niveau</span>
            </div>
            <p className="text-2xl font-bold text-white">{player.level}</p>
          </div>
        </div>

        {/* Zone de combat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Joueur */}
          <motion.div
            animate={animating && isPlayerTurn ? { x: [0, -10, 10, -10, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">{player.avatar}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{player.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${getElementColor(player.element)} text-white`}>
                    {player.element.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">Niv. {player.level}</span>
                </div>
              </div>
            </div>

            {/* Barre de vie */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-400">❤️ PV</span>
                <span className="text-white">{player.health}/{player.maxHealth}</span>
              </div>
              <div className="h-3 bg-red-900/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                  style={{ width: `${playerHealthBarWidth}%` }}
                  animate={{ width: `${playerHealthBarWidth}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Barre de mana */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-400">💙 Mana</span>
                <span className="text-white">{player.mana}/{player.maxMana}</span>
              </div>
              <div className="h-2 bg-blue-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                  style={{ width: `${(player.mana / player.maxMana) * 100}%` }}
                />
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-gray-400">⚔️ Attaque</p>
                <p className="text-white font-bold">{player.attack}</p>
              </div>
              <div>
                <p className="text-gray-400">🛡️ Défense</p>
                <p className="text-white font-bold">{player.defense}</p>
              </div>
              <div>
                <p className="text-gray-400">⚡ Vitesse</p>
                <p className="text-white font-bold">{player.speed}</p>
              </div>
            </div>
          </motion.div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <div className="text-5xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
              VS
            </div>
          </div>

          {/* Ennemi */}
          <motion.div
            animate={animating && !isPlayerTurn ? { x: [0, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-br from-red-900/50 to-orange-900/50 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">{enemy.avatar}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{enemy.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${getElementColor(enemy.element)} text-white`}>
                    {enemy.element.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">Niv. {enemy.level}</span>
                </div>
              </div>
            </div>

            {/* Barre de vie ennemie */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-400">❤️ PV</span>
                <span className="text-white">{Math.max(0, enemy.health)}/{enemy.maxHealth}</span>
              </div>
              <div className="h-3 bg-red-900/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                  style={{ width: `${enemyHealthBarWidth}%` }}
                  animate={{ width: `${enemyHealthBarWidth}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Statistiques ennemies */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-gray-400">⚔️ Attaque</p>
                <p className="text-white font-bold">{enemy.attack}</p>
              </div>
              <div>
                <p className="text-gray-400">🛡️ Défense</p>
                <p className="text-white font-bold">{enemy.defense}</p>
              </div>
              <div>
                <p className="text-gray-400">⚡ Vitesse</p>
                <p className="text-white font-bold">{enemy.speed}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Zone de combat - Skills */}
        {!battleEnded && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compétences du joueur */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Swords className="h-5 w-5 text-yellow-400" />
                  Compétences
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {player.skills.map((skill) => {
                    const SkillIcon = skill.icon
                    const isAvailable = player.mana >= skill.manaCost && skill.currentCooldown === 0 && isPlayerTurn && !battleEnded
                    return (
                      <motion.button
                        key={skill.id}
                        whileHover={{ scale: isAvailable ? 1.02 : 1 }}
                        whileTap={{ scale: isAvailable ? 0.98 : 1 }}
                        onClick={() => performSkill(skill)}
                        disabled={!isAvailable || !isPlayerTurn || battleEnded}
                        className={`p-4 rounded-xl text-left transition-all ${
                          isAvailable && isPlayerTurn
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg cursor-pointer'
                            : 'bg-gray-700/50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <SkillIcon className="h-5 w-5 text-white" />
                          <span className="font-semibold text-white">{skill.name}</span>
                          {skill.currentCooldown > 0 && (
                            <span className="text-xs text-yellow-400 ml-auto">{skill.currentCooldown}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-300 mb-2">{skill.description}</p>
                        <div className="flex gap-3 text-xs">
                          <span className="text-blue-300">💙 {skill.manaCost}</span>
                          <span className="text-red-300">⚔️ {skill.damage > 0 ? skill.damage : skill.damage < 0 ? 'Soin' : 'Buff'}</span>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
                
                {!isPlayerTurn && !battleEnded && (
                  <div className="mt-4 text-center text-yellow-400 animate-pulse">
                    ⏳ Tour de l'ennemi...
                  </div>
                )}
              </div>
            </div>

            {/* Journal de combat */}
            <div>
              <div className="bg-black/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 h-full">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  Journal de combat
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <AnimatePresence>
                    {battleLogs.slice(-8).map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className={`text-sm p-2 rounded ${
                          log.type === 'damage' ? 'bg-red-500/20 text-red-300' :
                          log.type === 'heal' ? 'bg-green-500/20 text-green-300' :
                          log.type === 'critical' ? 'bg-yellow-500/20 text-yellow-300' :
                          log.type === 'victory' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {log.message}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Résultat du combat */}
        {battleEnded && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-6 text-center"
          >
            <div className={`rounded-2xl p-8 ${
              battleResult === 'victory' 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                : 'bg-gradient-to-r from-red-600 to-red-700'
            }`}>
              {battleResult === 'victory' ? (
                <>
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
                  <h2 className="text-3xl font-bold text-white mb-2">Victoire!</h2>
                  <p className="text-white/90 mb-4">Vous avez vaincu {enemy.name}!</p>
                </>
              ) : (
                <>
                  <Skull className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h2 className="text-3xl font-bold text-white mb-2">Défaite...</h2>
                  <p className="text-white/90 mb-4">Vous avez été vaincu par {enemy.name}</p>
                </>
              )}
              <button
                onClick={startNewBattle}
                className="px-8 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Nouveau combat
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}