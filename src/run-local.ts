import { loadOriginalImage, saveProcessedImage } from './s3'
import sharp from 'sharp'

async function main() {
  const image = await loadOriginalImage('image/image-uuid')
  if (!image) throw Error('not found')
  console.log(image?.bytes.length)

  const transformer = sharp(image.bytes)
  transformer.webp({ quality: 90 })
  transformer.resize(100)
  const bytes = await transformer.toBuffer()
  console.log(bytes.length)

  await saveProcessedImage('image/test', { bytes, contentType: 'image/webp' })
  console.log('saved')
}

main().catch(console.error)

// npx ts-node -T src/run-local.ts
