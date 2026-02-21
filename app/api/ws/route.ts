import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Cette route permet à Next.js d'accepter les connexions WebSocket
  // Le vrai traitement WebSocket se fait dans le serveur WebSocket personnalisé
  return new Response('WebSocket endpoint', { 
    status: 200,
    headers: {
      'Upgrade': 'websocket'
    }
  })
}

export async function POST(request: NextRequest) {
  return new Response('WebSocket endpoint', { status: 200 })
}