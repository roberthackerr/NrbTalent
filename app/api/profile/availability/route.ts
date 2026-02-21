import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function PATCH(request: Request) {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { availability } = await request.json()

    // Ici, mettre à jour la disponibilité dans la base de données
    // await updateUserAvailability(session.user.id, availability)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}