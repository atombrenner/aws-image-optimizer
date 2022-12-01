import { createHmac } from 'crypto'
import { env } from './env'

const secret = env('SIGNATURE_SECRET')

export const sign = (path: string) =>
  path + '/' + createHmac('sha256', secret).update(path).digest('base64url').substring(10)

export const verify = (path: string): string | undefined => {
  const sigStart = path.lastIndexOf('/')
  const signature = path.substring(sigStart + 1)
  const pathWithoutSignature = path.substring(0, sigStart)
  if (sign(pathWithoutSignature) != signature) return undefined
  return pathWithoutSignature
}
