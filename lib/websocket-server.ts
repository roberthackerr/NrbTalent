// lib/websocket-server.ts
import { Server } from 'http';
import { WebSocketServer } from 'ws';

interface ClientInfo {
  ws: any;
  userId: string;
  userName: string;
  projectId: string;
  color: string;
  lastActivity: number;
}

export class WhiteboardWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientInfo> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/api/ws/whiteboard' });

    this.wss.on('connection', (ws, request) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const projectId = url.searchParams.get('projectId') || 'default';
      const userId = url.searchParams.get('userId') || 'anonymous';
      const userName = url.searchParams.get('userName') || 'Utilisateur';
      const color = url.searchParams.get('color') || '#3b82f6';

      const clientId = `${projectId}-${userId}`;
      
      // Stocker le client
      this.clients.set(clientId, {
        ws,
        userId,
        userName,
        projectId,
        color,
        lastActivity: Date.now()
      });

      console.log(`👤 Nouveau client connecté: ${userName} (${userId}) sur projet ${projectId}`);

      // Message de bienvenue
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        data: {
          message: 'Bienvenue sur le whiteboard collaboratif',
          userId,
          userName,
          projectId,
          timestamp: Date.now()
        }
      }));

      // Notifier les autres utilisateurs
      this.broadcastToProject(projectId, {
        type: 'USER_JOINED',
        data: { userId, userName, color, timestamp: Date.now() }
      }, userId);

      // Gérer les messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('❌ Erreur parsing message:', error);
        }
      });

      // Gérer la déconnexion
      ws.on('close', () => {
        console.log(`👋 Client déconnecté: ${userName} (${userId})`);
        this.clients.delete(clientId);
        
        // Notifier les autres utilisateurs
        this.broadcastToProject(projectId, {
          type: 'USER_LEFT',
          data: { userId, userName, timestamp: Date.now() }
        });
      });

      // Ping/pong pour garder la connexion active
      const pingInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);

      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastActivity = Date.now();
        }
      });
    });

    // Nettoyer les connexions inactives
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 60000);

    console.log('✅ WebSocket Server initialisé sur /api/ws/whiteboard');
  }

  private handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = Date.now();

    switch (message.type) {
      case 'WHITEBOARD_DRAW':
      case 'WHITEBOARD_CLEAR':
      case 'WHITEBOARD_CURSOR':
        this.broadcastToProject(client.projectId, message, client.userId);
        break;

      case 'PING':
        client.ws.send(JSON.stringify({
          type: 'PONG',
          data: { timestamp: Date.now() }
        }));
        break;

      default:
        console.log('📨 Message non traité:', message.type);
    }
  }

  private broadcastToProject(projectId: string, message: any, excludeUserId?: string) {
    let sentCount = 0;
    
    this.clients.forEach((client, clientId) => {
      if (client.projectId === projectId && client.userId !== excludeUserId) {
        if (client.ws.readyState === client.ws.OPEN) {
          client.ws.send(JSON.stringify(message));
          sentCount++;
        }
      }
    });

    if (sentCount > 0) {
      console.log(`📤 Broadcast à ${sentCount} client(s) dans le projet ${projectId}`);
    }
  }

  private cleanupInactiveConnections() {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    this.clients.forEach((client, clientId) => {
      if (now - client.lastActivity > inactiveThreshold) {
        console.log(`🧹 Nettoyage connexion inactive: ${client.userName}`);
        client.ws.close();
        this.clients.delete(clientId);
      }
    });
  }

  getStats() {
    const projects = new Map<string, number>();
    
    this.clients.forEach(client => {
      const count = projects.get(client.projectId) || 0;
      projects.set(client.projectId, count + 1);
    });

    return {
      totalClients: this.clients.size,
      projects: Object.fromEntries(projects),
      activeClients: Array.from(this.clients.values()).map(c => ({
        userId: c.userId,
        userName: c.userName,
        projectId: c.projectId,
        lastActivity: new Date(c.lastActivity).toISOString()
      }))
    };
  }
}

export const whiteboardWebSocketServer = new WhiteboardWebSocketServer();