// app/api/ws/[route]/route.ts
import { NextRequest } from 'next/server';

// Nous devons gérer le WebSocket manuellement car Next.js ne supporte pas nativement les WebSockets
// Nous allons créer un WebSocket server séparé

export const runtime = 'nodejs'; // Important pour supporter les WebSockets

// Stockage des connexions actives
const connections = new Map<string, WebSocket>();

// Classe pour gérer les WebSockets
class WebSocketManager {
  private wsServer: any = null;
  private connections: Map<string, { ws: WebSocket; userId: string; projectId: string }> = new Map();

  async initialize(server: any) {
    if (this.wsServer) {
      return;
    }

    const { WebSocketServer } = await import('ws');
    this.wsServer = new WebSocketServer({ noServer: true });

    // Gérer les nouvelles connexions
    this.wsServer.on('connection', (ws: WebSocket, request: Request) => {
      const url = new URL(request.url, 'http://localhost');
      const projectId = url.searchParams.get('projectId');
      const userId = url.searchParams.get('userId');
      const connectionId = `${projectId}-${userId}`;

      console.log(`Nouvelle connexion WebSocket: ${connectionId}`);

      // Stocker la connexion
      this.connections.set(connectionId, { ws, userId: userId || 'anonymous', projectId: projectId || 'default' });

      // Gérer les messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.broadcastToProject(projectId || 'default', message, userId || 'anonymous');
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      });

      // Gérer la déconnexion
      ws.on('close', () => {
        console.log(`Déconnexion WebSocket: ${connectionId}`);
        this.connections.delete(connectionId);
      });

      // Envoyer un message de bienvenue
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        data: { message: 'Connecté au whiteboard', userId, projectId },
        timestamp: Date.now()
      }));
    });
  }

  broadcastToProject(projectId: string, message: any, excludeUserId?: string) {
    let count = 0;
    this.connections.forEach((connection, connectionId) => {
      if (connection.projectId === projectId && connection.userId !== excludeUserId) {
        if (connection.ws.readyState === connection.ws.OPEN) {
          connection.ws.send(JSON.stringify(message));
          count++;
        }
      }
    });
    console.log(`Message broadcast à ${count} utilisateurs dans le projet ${projectId}`);
  }

  getConnectionStats() {
    const projects = new Map<string, number>();
    this.connections.forEach(connection => {
      const count = projects.get(connection.projectId) || 0;
      projects.set(connection.projectId, count + 1);
    });
    
    return {
      totalConnections: this.connections.size,
      projects: Object.fromEntries(projects),
      connections: Array.from(this.connections.values()).map(c => ({
        userId: c.userId,
        projectId: c.projectId
      }))
    };
  }
}

export const webSocketManager = new WebSocketManager();

// Handler pour les requêtes HTTP normales (retourne les stats)
export async function GET(
  request: NextRequest,
  { params }: { params: { route: string } }
) {
  const route = params.route;

  if (route === 'stats') {
    return new Response(
      JSON.stringify(webSocketManager.getConnectionStats()),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Route WebSocket non trouvée' }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}