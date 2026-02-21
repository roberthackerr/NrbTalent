import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'verifications')

export interface UploadedFile {
  url: string
  path: string
  filename: string
  size: number
  mimeType: string
  uploadedAt: Date
}

export async function uploadLocal(
  file: File,
  userId: string
): Promise<UploadedFile> {
  try {
    // Créer le dossier si inexistant
    const userDir = path.join(UPLOADS_DIR, userId)
    await fs.mkdir(userDir, { recursive: true })

    // Lire le fichier
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Générer un nom unique
    const fileExtension = path.extname(file.name) || '.jpg'
    const uniqueFilename = `${uuidv4()}${fileExtension}`
    const filePath = path.join(userDir, uniqueFilename)

    // Optimiser les images
    let optimizedBuffer = buffer
    if (file.type.startsWith('image/')) {
      try {
        optimizedBuffer = await sharp(buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer()
      } catch (error) {
        console.warn('Image optimization failed:', error)
      }
    }

    // Sauvegarder le fichier
    await fs.writeFile(filePath, optimizedBuffer)

    // URL accessible depuis le frontend
    const url = `/uploads/verifications/${userId}/${uniqueFilename}`

    return {
      url,
      path: filePath,
      filename: uniqueFilename,
      size: optimizedBuffer.length,
      mimeType: file.type,
      uploadedAt: new Date()
    }
  } catch (error) {
    console.error('Local upload error:', error)
    throw new Error('Failed to upload file locally')
  }
}