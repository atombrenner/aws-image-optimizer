import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { env } from './env'

const originalImagesBucket = env('ORIGINAL_IMAGES_BUCKET')
const processedImagesBucket = env('PROCESSED_IMAGES_BUCKET')

const s3 = new S3Client({})

export const loadOriginalImage = async (path: string): Promise<Uint8Array | undefined> => {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: originalImagesBucket,
      Key: path,
    })
  )
  if (!response.Body) return undefined
  console.log('got response')

  return await response.Body.transformToByteArray()
}

export const saveProcessedImage = async (
  path: string,
  image: Buffer,
  contentType: string,
  cacheControl: string
) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: processedImagesBucket,
      Key: path,
      Body: image,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  )
}
