import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function PATCH(request: Request) {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { bio } = await request.json()

    // Ici, mettre à jour la bio dans la base de données
    // await updateUserBio(session.user.id, bio)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating bio:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}