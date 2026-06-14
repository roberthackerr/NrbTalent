// app/[lang]/games/combat-3d/page.tsx
'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Box, Sphere, Cylinder, useTexture, Html } from '@react-three/drei'
import { Physics, useBox, useSphere, usePlane } from '@react-three/cannon'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { Swords, Heart, Zap, Shield, Target, Trophy, Skull, RefreshCw } from 'lucide-react'

// Interface pour les personnages
interface Character {
  id: string
  name: string
  health: number
  maxHealth: number
  attack: number
  defense: number
  isAttacking: boolean
  isHit: boolean
}

// Composant Personnage 3D
function Character3D({ 
  position, 
  color, 
  health, 
  maxHealth,
  isAttacking,
  isHit,
  name,
  onAttack
}: { 
  position: [number, number, number]
  color: string
  health: number
  maxHealth: number
  isAttacking: boolean
  isHit: boolean
  name: string
  onAttack?: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [attackAnimation, setAttackAnimation] = useState(0)
  const [hitAnimation, setHitAnimation] = useState(0)
  const [idleRotation, setIdleRotation] = useState(0)

  useFrame((state) => {
    if (groupRef.current) {
      // Animation d'attaque
      if (isAttacking && attackAnimation < 1) {
        setAttackAnimation(prev => Math.min(prev + 0.15, 1))
        groupRef.current.position.x = position[0] + Math.sin(attackAnimation * Math.PI) * 0.5
        groupRef.current.rotation.z = Math.sin(attackAnimation * Math.PI) * 0.5
      } else if (attackAnimation > 0) {
        setAttackAnimation(prev => Math.max(prev - 0.1, 0))
        groupRef.current.position.x = position[0]
        groupRef.current.rotation.z = 0
      }

      // Animation de dégât
      if (isHit && hitAnimation < 1) {
        setHitAnimation(prev => Math.min(prev + 0.2, 1))
        groupRef.current.position.y = position[1] + Math.sin(hitAnimation * Math.PI) * 0.3
        groupRef.current.rotation.x = Math.sin(hitAnimation * Math.PI) * 0.3
      } else if (hitAnimation > 0) {
        setHitAnimation(prev => Math.max(prev - 0.1, 0))
        groupRef.current.position.y = position[1]
        groupRef.current.rotation.x = 0
      }

      // Animation d'inactivité
      if (!isAttacking && !isHit && attackAnimation === 0 && hitAnimation === 0) {
        setIdleRotation(idleRotation => idleRotation += 0.02 )
       
        groupRef.current.position.y = position[1] + Math.sin(idleRotation) * 0.05
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Corps */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Tête */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
      </mesh>
      
      {/* Yeux */}
      <mesh position={[-0.15, 0.8, 0.4]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.15, 0.8, 0.4]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Casque/Armure */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.5, 0.3, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
      </mesh>
      
      {/* Épée (si le personnage attaque) */}
      {isAttacking && (
        <mesh position={[0.6, 0.2, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
          <boxGeometry args={[0.8, 0.1, 0.1]} />
          <meshStandardMaterial color="#silver" metalness={0.9} />
        </mesh>
      )}
      
      {/* Barre de vie */}
      <Html position={[0, 1.2, 0]} center>
        <div className="bg-black/80 rounded-lg px-3 py-1 min-w-[120px] backdrop-blur-sm">
          <div className="text-white text-xs font-bold mb-1">{name}</div>
          <div className="h-2 bg-red-500/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
              style={{ width: `${(health / maxHealth) * 100}%` }}
            />
          </div>
          <div className="text-white text-xs mt-1 text-center">{health}/{maxHealth}</div>
        </div>
      </Html>
    </group>
  )
}

// Plateforme de combat
function Arena() {
  return (
    <>
      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.2} roughness={0.8} />
      </mesh>
      
      {/* Grille d'arène */}
      <gridHelper args={[10, 20, '#444', '#333']} position={[0, -0.4, 0]} />
      
      {/* Lumières */}
      <pointLight position={[2, 3, 2]} intensity={1} castShadow />
      <pointLight position={[-2, 3, -2]} intensity={0.5} />
      <ambientLight intensity={0.5} />
      
      {/* Effet de lumière rouge/bleue */}
      <spotLight
        position={[3, 2, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={0.5}
        color="#ff3366"
      />
      <spotLight
        position={[-3, 2, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={0.5}
        color="#33ff66"
      />
    </>
  )
}

// Particules d'attaque
function AttackEffect({ position, onComplete }: { position: [number, number, number], onComplete: () => void }) {
  const particlesRef = useRef<THREE.Points>(null)
  let time = 0

  useFrame(() => {
    time += 0.1
    if (particlesRef.current && time < 1) {
      particlesRef.current.rotation.y = time * Math.PI * 2
      particlesRef.current.scale.setScalar(1 - time * 0.5)
    } else if (time >= 1) {
      onComplete()
    }
  })

  return (
    <points ref={particlesRef} position={position}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <pointsMaterial color="#ff3366" size={0.1} />
    </points>
  )
}

// Composant principal du jeu
export default function Combat3DGame() {
  const [player, setPlayer] = useState<Character>({
    id: 'player',
    name: 'Guerrier',
    health: 100,
    maxHealth: 100,
    attack: 25,
    defense: 10,
    isAttacking: false,
    isHit: false
  })
  
  const [enemy, setEnemy] = useState<Character>({
    id: 'enemy',
    name: 'Démon des Abysses',
    health: 120,
    maxHealth: 120,
    attack: 20,
    defense: 8,
    isAttacking: false,
    isHit: false
  })
  
  const [battleLogs, setBattleLogs] = useState<{ message: string, type: string }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [victory, setVictory] = useState(false)
  const [showAttackEffect, setShowAttackEffect] = useState(false)
  const [attackEffectPos, setAttackEffectPos] = useState<[number, number, number]>([0, 0, 0])
  const [playerTurn, setPlayerTurn] = useState(true)
  const [cooldown, setCooldown] = useState(0)

  const addLog = (message: string, type: string) => {
    setBattleLogs(prev => [...prev.slice(-9), { message, type }])
  }

  const calculateDamage = (attacker: Character, defender: Character): number => {
    let damage = Math.max(5, attacker.attack - defender.defense + Math.floor(Math.random() * 15))
    const isCritical = Math.random() < 0.15
    if (isCritical) {
      damage = Math.floor(damage * 1.5)
      addLog(`💥 Coup critique! +${damage} dégâts!`, 'critical')
    }
    return damage
  }

  const playerAttack = async () => {
    if (!playerTurn || gameOver || cooldown > 0) return
    
    setPlayerTurn(false)
    setCooldown(2)
    
    // Animation d'attaque
    setPlayer(prev => ({ ...prev, isAttacking: true }))
    setAttackEffectPos([1.2, 0.2, 0])
    setShowAttackEffect(true)
    
    setTimeout(() => {
      const damage = calculateDamage(player, enemy)
      const newEnemyHealth = Math.max(0, enemy.health - damage)
      
      setEnemy(prev => ({ ...prev, health: newEnemyHealth, isHit: true }))
      addLog(`⚔️ ${player.name} inflige ${damage} dégâts!`, 'damage')
      
      setTimeout(() => {
        setEnemy(prev => ({ ...prev, isHit: false }))
        setPlayer(prev => ({ ...prev, isAttacking: false }))
        
        if (newEnemyHealth <= 0) {
          setGameOver(true)
          setVictory(true)
          addLog(`🎉 Victoire! ${player.name} a vaincu ${enemy.name}!`, 'victory')
        } else {
          setTimeout(() => enemyAttack(), 1000)
        }
      }, 300)
    }, 500)
  }

  const enemyAttack = () => {
    setEnemy(prev => ({ ...prev, isAttacking: true }))
    setAttackEffectPos([-1.2, 0.2, 0])
    setShowAttackEffect(true)
    
    setTimeout(() => {
      const damage = calculateDamage(enemy, player)
      const newPlayerHealth = Math.max(0, player.health - damage)
      
      setPlayer(prev => ({ ...prev, health: newPlayerHealth, isHit: true }))
      addLog(`💢 ${enemy.name} inflige ${damage} dégâts!`, 'damage')
      
      setTimeout(() => {
        setPlayer(prev => ({ ...prev, isHit: false }))
        setEnemy(prev => ({ ...prev, isAttacking: false }))
        
        if (newPlayerHealth <= 0) {
          setGameOver(true)
          setVictory(false)
          addLog(`💀 Défaite... ${player.name} a été vaincu!`, 'defeat')
        } else {
          setPlayerTurn(true)
        }
      }, 300)
    }, 500)
  }

  const resetGame = () => {
    setPlayer({
      id: 'player',
      name: 'Guerrier',
      health: 100,
      maxHealth: 100,
      attack: 25,
      defense: 10,
      isAttacking: false,
      isHit: false
    })
    setEnemy({
      id: 'enemy',
      name: 'Démon des Abysses',
      health: 120,
      maxHealth: 120,
      attack: 20,
      defense: 8,
      isAttacking: false,
      isHit: false
    })
    setBattleLogs([])
    setGameOver(false)
    setVictory(false)
    setPlayerTurn(true)
    setCooldown(0)
    addLog('⚔️ Nouveau combat!', 'info')
  }

  // Effet de cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="relative h-screen">
        {/* Canvas 3D */}
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4 mx-auto" />
              <p className="text-white">Chargement du jeu 3D...</p>
            </div>
          </div>
        }>
          <Canvas
            shadows
            camera={{ position: [0, 2, 8], fov: 60 }}
            style={{ background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%)' }}
          >
            <Arena />
            
            {/* Personnage Joueur */}
            <Character3D
              position={[-2, -0.2, 0]}
              color="#3b82f6"
              health={player.health}
              maxHealth={player.maxHealth}
              isAttacking={player.isAttacking}
              isHit={player.isHit}
              name={player.name}
            />
            
            {/* Personnage Ennemi */}
            <Character3D
              position={[2, -0.2, 0]}
              color="#ef4444"
              health={enemy.health}
              maxHealth={enemy.maxHealth}
              isAttacking={enemy.isAttacking}
              isHit={enemy.isHit}
              name={enemy.name}
            />
            
            {/* Effet d'attaque */}
            {showAttackEffect && (
              <AttackEffect
                position={attackEffectPos}
                onComplete={() => setShowAttackEffect(false)}
              />
            )}
            
            <OrbitControls 
              enablePan={false} 
              enableZoom={false}
              maxPolarAngle={Math.PI / 3}
              target={[0, 0.5, 0]}
            />
          </Canvas>
        </Suspense>

        {/* Interface Utilisateur */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Titre */}
          <div className="absolute top-4 left-0 right-0 text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500 bg-clip-text text-transparent">
              Combat Arène 3D
            </h1>
          </div>

          {/* Panneau de contrôle */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-md pointer-events-auto">
            {!gameOver ? (
              <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex gap-4">
                  <button
                    onClick={playerAttack}
                    disabled={!playerTurn || cooldown > 0}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      playerTurn && cooldown === 0
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg cursor-pointer'
                        : 'bg-gray-700 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Swords className="h-5 w-5" />
                    {cooldown > 0 ? `Recharge (${cooldown})` : 'Attaquer!'}
                  </button>
                </div>
                
                {/* Indicateur de tour */}
                <div className="mt-4 text-center">
                  {playerTurn ? (
                    <div className="text-green-400 animate-pulse">Votre tour!</div>
                  ) : (
                    <div className="text-yellow-400 animate-pulse">Tour de l'ennemi...</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center">
                {victory ? (
                  <>
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-white mb-2">Victoire!</h2>
                    <p className="text-gray-300 mb-4">Vous avez triomphé de l'ennemi!</p>
                  </>
                ) : (
                  <>
                    <Skull className="h-16 w-16 mx-auto mb-4 text-red-400" />
                    <h2 className="text-2xl font-bold text-white mb-2">Défaite...</h2>
                    <p className="text-gray-300 mb-4">Vous avez été vaincu</p>
                  </>
                )}
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  Nouveau combat
                </button>
              </div>
            )}
          </div>

          {/* Journal de combat */}
          <div className="absolute top-20 right-4 w-72 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Journal de combat
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {battleLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`text-xs p-2 rounded ${
                      log.type === 'damage' ? 'bg-red-500/20 text-red-300' :
                      log.type === 'critical' ? 'bg-yellow-500/20 text-yellow-300' :
                      log.type === 'victory' ? 'bg-green-500/20 text-green-300' :
                      log.type === 'defeat' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="absolute bottom-4 left-4 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="text-white">PV: {player.health}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-white">Atk: {player.attack}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span className="text-white">Def: {player.defense}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}