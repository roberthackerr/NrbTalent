import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache, no-transform',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'CONNECTED', message: 'Connected to notification stream' })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        const data = `data: ${JSON.stringify({ type: 'HEARTBEAT', timestamp: new Date().toISOString() })}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      }, 30000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        controller.close();
      });
    }
  });

  return new Response(stream, { headers });
}

// Note: For full SSE functionality, you'll need to implement a proper
// client management system to broadcast messages to specific users
