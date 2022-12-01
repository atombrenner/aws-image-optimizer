import { GetObjectCommand, PutObjectCommand, S3Client, NoSuchKey } from '@aws-sdk/client-s3'
import { env } from './env'

const originalBucket = env('ORIGINAL_BUCKET')
const processedBucket = env('PROCESSED_BUCKET')
const originalKeyPrefix = env('ORIGINAL_KEY_PREFIX')

const s3 = new S3Client({})

export const loadOriginalImage = async (id: string): Promise<Uint8Array | undefined> => {
  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: originalBucket,
        Key: originalKeyPrefix + id,
      })
    )
    return response.Body && response.Body.transformToByteArray()
  } catch (err) {
    if (err instanceof NoSuchKey) return undefined
    throw err
  }
}

export const saveProcessedImage = async (
  path: string,
  image: Buffer,
  contentType: string,
  cacheControl: string
) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: processedBucket,
      Key: path.substring(1),
      Body: image,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  )
}
