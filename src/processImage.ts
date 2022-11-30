import sharp from 'sharp'

export const processImage = async (image: Uint8Array, params: unknown): Promise<Buffer> => {
  const processor = sharp(image)
  processor.rotate() // normalize rotation
  processor.webp({ quality: 80 })
  processor.resize(4000)
  return await processor.toBuffer()
}
