import { RtcTokenBuilder, RtcRole } from 'agora-token'

export function generateToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: string | number,
  role: RtcRole,
  privilegeExpiredTs = 3600 // 1 hour by default
): string {
  // Build token with uid
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