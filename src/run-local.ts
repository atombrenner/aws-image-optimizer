import { loadOriginalImage, saveProcessedImage } from './s3'
import sharp from 'sharp'

async function main() {
  const image = await loadOriginalImage('image/image-uuid')
  if (!image) throw Error('not found')

  const transformer = sharp(image)
  transformer.webp({ quality: 90 })
  transformer.resize(100)
  const buffer = await transformer.toBuffer()
  await saveProcessedImage('image/test', buffer, 'image/webp', 'public, max-age=300')

  console.log('saved')
}

// TODO: fire up a local node server for interactive testing

main().catch(console.error)

// npx ts-node -T src/run-local.ts
