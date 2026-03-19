import { NextRequest, NextResponse } from 'next/server'
import { generateAgoraToken } from '@/lib/agora-token'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.AGORA_APP_ID) {
      throw new Error('AGORA_APP_ID environment variable is not set')
    }
    
    if (!process.env.AGORA_APP_CERTIFICATE) {
      throw new Error('AGORA_APP_CERTIFICATE environment variable is not set')
    }

    const { searchParams } = new URL(request.url)
    const channelName = searchParams.get('channel') || `test-${Date.now()}`
    const uid = searchParams.get('uid') || Math.floor(Math.random() * 100000)
    
    const token = generateAgoraToken(channelName, uid.toString())
    
    return NextResponse.json({
      success: true,
      appId: process.env.AGORA_APP_ID,
      token,
      channelName,
      uid: Number(uid),
      expiresIn: 3600
    })
    
  } catch (error: any) {
    console.error('Error generating Agora token:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      requiredEnvVars: {
        AGORA_APP_ID: process.env.AGORA_APP_ID ? 'Set' : 'Missing',
        AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE ? 'Set' : 'Missing'
      }
    }, { status: 500 })
  }
}