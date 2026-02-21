import { RtcTokenBuilder, RtcRole } from 'agora-token'

export function generateAgoraToken(
  channelName: string,
  uid: string | number = 0,
  role: RtcRole = RtcRole.PUBLISHER,
  expireTime: number = 3600 // 1 hour
): string {
  const appId = process.env.AGORA_APP_ID
  const appCertificate = process.env.AGORA_APP_CERTIFICATE
  
  if (!appId) {
    throw new Error('AGORA_APP_ID is not configured in environment variables')
  }
  
  if (!appCertificate) {
    throw new Error('AGORA_APP_CERTIFICATE is not configured in environment variables')
  }

  const currentTimestamp = Math.floor(Date.now() / 1000)
  const privilegeExpiredTs = currentTimestamp + expireTime

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    typeof uid === 'string' ? parseInt(uid) : uid,
    role,
    privilegeExpiredTs,
    privilegeExpiredTs
  )
  
  return token
}

export { RtcRole }