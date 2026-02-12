import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const style = formData.get('style') as string
    const userId = formData.get('userId') as string || 'default-user'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Create unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${originalName}`

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadsDir, filename)
    await writeFile(filePath, buffer)

    const imageUrl = `/uploads/${filename}`

    // Generate mock AI image (in production, this would call an AI service)
    const generatedFilename = `generated-${timestamp}.png`
    const generatedImagePath = join(uploadsDir, generatedFilename)
    // For now, just copy the original
    await writeFile(generatedImagePath, buffer)
    const generatedImageUrl = `/uploads/${generatedFilename}`

    // Save to database
    const petIP = await prisma.petIP.create({
      data: {
        userId,
        name: name || '未命名宠物',
        style,
        originalImage: imageUrl,
        generatedImage: generatedImageUrl,
        rarity: Math.random() < 0.1 ? 'Legendary' : 
                 Math.random() < 0.3 ? 'Epic' :
                 Math.random() < 0.5 ? 'Rare' : 'Common',
      },
    })

    return NextResponse.json({
      success: true,
      data: petIP,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
