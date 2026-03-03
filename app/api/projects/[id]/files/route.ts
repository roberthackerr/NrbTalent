import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    
    // In production, get files from database
    const mockFiles = [
      {
        id: '1',
        name: 'Spécifications.pdf',
        type: 'document' as const,
        size: '2.4 MB',
        uploadedBy: 'Jean Dupont',
        uploadedAt: new Date('2024-01-15'),
        version: 2
      },
      {
        id: '2',
        name: 'wireframes.fig',
        type: 'document' as const,
        size: '1.8 MB',
        uploadedBy: 'Marie Martin',
        uploadedAt: new Date('2024-01-16'),
        version: 1
      },
      {
        id: '3',
        name: 'dashboard-design.png',
        type: 'image' as const,
        size: '4.2 MB',
        uploadedBy: 'Jean Dupont',
        uploadedAt: new Date('2024-01-17'),
        version: 1
      }
    ]

    return NextResponse.json(mockFiles)
  } catch (error) {
    console.error('Error fetching project files:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const uploadedFiles = []
    
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `${Date.now()}-${file.name}`
      const path = join(uploadDir, fileName)
      
      await writeFile(path, buffer)
      
      uploadedFiles.push({
        name: file.name,
        path: `/uploads/projects/${projectId}/${fileName}`,
        size: file.size,
        type: file.type
      })
    }

    // In production, save file metadata to database
    // await db.projectFiles.createMany(...)

    return NextResponse.json({ 
      success: true, 
      message: 'Files uploaded successfully',
      files: uploadedFiles 
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}