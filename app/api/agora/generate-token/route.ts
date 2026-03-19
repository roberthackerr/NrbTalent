import { NextRequest, NextResponse } from 'next/server'
import { generateToken, RtcRole } from '@/lib/agora'

const APP_ID = process.env.AGORA_APP_ID!
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelName, userId } = body
    
    if (!channelName || !userId) {
      return NextResponse.json(
        { error: 'Missing channel name or user ID' },
        { status: 400 }
      )
    }

    // Generate token for the user
    const uid = Math.floor(Math.random() * 100000)
    const token = generateToken(APP_ID, APP_CERTIFICATE, channelName, uid, RtcRole.PUBLISHER)
    
    return NextResponse.json({
      token,
      uid,
      appId: APP_ID
    })

  } catch (error) {
    console.error('Error generating token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}