import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { env } from './env'

const originalImagesBucket = env('ORIGINAL_IMAGES_BUCKET')
const processedImagesBucket = env('PROCESSED_IMAGES_BUCKET')

const s3 = new S3Client({})

export type ImageData = {
  bytes: Uint8Array | Buffer
  contentType: string
}

export const loadOriginalImage = async (path: string): Promise<ImageData | undefined> => {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: originalImagesBucket,
      Key: path,
      Range: 'basd',
    })
  )
  if (!response.Body) return undefined
  console.log('got response')

  return {
    bytes: await response.Body.transformToByteArray(),
    contentType: response.ContentType ?? 'application/octet-stream',
  }
}

export const saveProcessedImage = async (path: string, image: ImageData) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: processedImagesBucket,
      Key: path,
      Body: image.bytes,
      ContentType: image.contentType,
      CacheControl: 'public,max-age=120',
    })
  )
}
