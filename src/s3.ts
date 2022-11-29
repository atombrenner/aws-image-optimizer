import { S3Client } from '@aws-sdk/client-s3'

const bucket = process.env['BUCKET'] || 'please-name-your-bucket'

const s3 = new S3Client({
  region: process.env['REGION'] || 'eu-central-1',
})

export const loadImage = async (key: string): Promise<Buffer> => {
  return Buffer.from('')
}
