import sharp from 'sharp'
import { env } from './env'

const quality = Number.parseInt(env('IMAGE_QUALITY'))

export const processImage = async (image: Uint8Array, params: unknown): Promise<Buffer> => {
  const processor = sharp(image)
  processor.rotate() // normalize rotation
  processor.avif({ quality })
  //processor.jpeg()
  processor.resize(undefined, 100)
  return await processor.toBuffer()
}
