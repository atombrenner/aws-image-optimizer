import { GetObjectCommand, PutObjectCommand, S3Client, NoSuchKey } from '@aws-sdk/client-s3'
import { env } from './env'

const originalImagesBucket = env('ORIGINAL_IMAGES_BUCKET')
const processedImagesBucket = env('PROCESSED_IMAGES_BUCKET')

const s3 = new S3Client({})

export const loadOriginalImage = async (key: string): Promise<Uint8Array | undefined> => {
  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: originalImagesBucket,
        Key: key,
      })
    )
    return response.Body && response.Body.transformToByteArray()
  } catch (err) {
    if (err instanceof NoSuchKey) return undefined
    throw err
  }
}

export const saveProcessedImage = async (
  key: string,
  image: Buffer,
  contentType: string,
  cacheControl: string
) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: processedImagesBucket,
      Key: key,
      Body: image,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  )
}
