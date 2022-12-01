import sharp from 'sharp'
import { env } from './env'

const quality = Number.parseInt(env('IMAGE_QUALITY'))

export const imageTypes = ['webp', 'jpeg', 'avif']
export type ImageType = typeof imageTypes[number]

export type Point = {
  x: number
  y: number
}

export type ProcessingParams = {
  type?: ImageType
  width?: number
  height?: number
  crop?: {}

  // width or height or both
  // cropArea
  // focuspoint
}

export const processImage = async (image: Uint8Array, params: unknown): Promise<Buffer> => {
  const processor = sharp(image)
  processor.rotate() // normalize rotation
  processor.avif({ quality })
  //processor.jpeg()
  processor.resize(undefined, 100)
  return await processor.toBuffer()
}
