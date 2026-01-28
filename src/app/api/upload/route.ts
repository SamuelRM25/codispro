import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No se subió ningún archivo' },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const extension = file.name.split('.').pop()
        const filename = `${uuidv4()}.${extension}`
        const path = join(process.cwd(), 'public/uploads', filename)

        await writeFile(path, buffer)
        const url = `/uploads/${filename}`

        return NextResponse.json({ url })
    } catch (error: any) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { error: 'Error al subir archivo' },
            { status: 500 }
        )
    }
}
