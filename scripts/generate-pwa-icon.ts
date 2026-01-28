import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

async function generatePWAIcon() {
  const zai = await ZAI.create()

  console.log('Generating PWA icon...')

  const response = await zai.images.generations.create({
    prompt: 'Construction management app icon, hard hat and building, professional design, flat style, gradient blue and orange, simple and clean, modern, high quality, white background',
    size: '1024x1024'
  })

  const imageBase64 = response.data[0].base64
  const buffer = Buffer.from(imageBase64, 'base64')

  const outputPath = path.join(process.cwd(), 'public', 'icons', 'icon-1024.png')
  fs.writeFileSync(outputPath, buffer)

  console.log(`Icon saved to: ${outputPath}`)

  // Also create a 512x512 version
  const response512 = await zai.images.generations.create({
    prompt: 'Construction management app icon, hard hat and building, professional design, flat style, gradient blue and orange, simple and clean, modern, high quality, white background',
    size: '512x512'
  })

  const imageBase64512 = response512.data[0].base64
  const buffer512 = Buffer.from(imageBase64512, 'base64')

  const outputPath512 = path.join(process.cwd(), 'public', 'icons', 'icon-512.png')
  fs.writeFileSync(outputPath512, buffer512)

  console.log(`Icon saved to: ${outputPath512}`)

  // Also create a 192x192 version
  const response192 = await zai.images.generations.create({
    prompt: 'Construction management app icon, hard hat and building, professional design, flat style, gradient blue and orange, simple and clean, modern, high quality, white background',
    size: '192x192'
  })

  const imageBase64192 = response192.data[0].base64
  const buffer192 = Buffer.from(imageBase64192, 'base64')

  const outputPath192 = path.join(process.cwd(), 'public', 'icons', 'icon-192.png')
  fs.writeFileSync(outputPath192, buffer192)

  console.log(`Icon saved to: ${outputPath192}`)
}

generatePWAIcon().catch(console.error)
