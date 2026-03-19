import { NextRequest, NextResponse } from 'next/server'
import { generateToken, RtcRole } from '@/lib/agora'

// Your Agora App ID and Certificate (get from console.agora.io)
const APP_ID = process.env.AGORA_APP_ID!
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, projectId, freelancerId, clientId } = body
    
    if (!userId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique channel name for this meeting
    // Format: project-{projectId}-freelancer-{freelancerId}-client-{clientId}
    const channelName = `project-${projectId}-${Date.now()}`
    
    // Generate token for authentication (optional but recommended for production)
    const token = generateToken(APP_ID, APP_CERTIFICATE, channelName, userId, RtcRole.PUBLISHER)
    
    // Generate random UID for the user
    const uid = Math.floor(Math.random() * 100000)
    
    // Optional: Store meeting info in your database
    // await db.meetings.create({
    //   data: {
    //     channelName,
    //     projectId,
    //     freelancerId,
    //     clientId,
    //     createdBy: userId,
    //     expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    //   }
    // })

    return NextResponse.json({
      success: true,
      channelName,
      token,
      uid,
      appId: APP_ID,
      expiresIn: 7200 // 2 hours in seconds
    })

  } catch (error) {
    console.error('Error creating Agora channel:', error)
    return NextResponse.json(
      { error: 'Failed to create video room' },
      { status: 500 }
    )
  }
}