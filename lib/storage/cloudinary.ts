import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadedFile {
  url: string
  public_id: string
  format: string
  bytes: number
  secure_url: string
  created_at: string
}

export async function uploadToCloudinary(
  file: File | Buffer,
  folder: string = 'verifications'
): Promise<UploadedFile> {
  try {
    let buffer: Buffer
    
    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer())
    } else {
      buffer = file
    }

    // Convertir le buffer en base64 pour Cloudinary
    const base64String = `data:image/jpeg;base64,${buffer.toString('base64')}`

    const result = await cloudinary.uploader.upload(base64String, {
      folder: `${folder}/${folder}`,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      max_bytes: 5 * 1024 * 1024, // 5MB
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    })

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
      secure_url: result.secure_url,
      created_at: result.created_at
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload file to Cloudinary')
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete file from Cloudinary')
  }
}