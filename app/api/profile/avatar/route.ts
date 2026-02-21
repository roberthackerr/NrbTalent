import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  const session = await getServerSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const filename = `avatar-${timestamp}-${file.name}`
    const uploadDir = path.join(process.cwd(), 'public/uploads/avatars')
    
    // Créer le dossier s'il n'existe pas
    await fs.mkdir(uploadDir, { recursive: true })

    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const avatarUrl = `/uploads/avatars/${filename}`

    // Ici, mettre à jour l'avatar dans la base de données
    // await updateUserAvatar(session.user.id, avatarUrl)

    return NextResponse.json({ avatarUrl })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}