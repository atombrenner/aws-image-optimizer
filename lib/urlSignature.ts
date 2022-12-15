import { createHmac } from 'crypto'

export const signedUrlPath = (path: string, secret: string) =>
  path + '/sig=' + computeSignature(path, secret)

export const computeSignature = (path: string, secret: string) =>
  createHmac('sha256', secret).update(path).digest('base64url')

export const hasValidSignature = (path: string, secret: string) => {
  // find signature part and cut it from path
  const start = path.lastIndexOf('/sig=')
  if (start < 0) return false

  // extract signature
  const signature = path.substring(start).split('=')[1]
  if (!signature) return false

  // calculate signature of remaining path
  const computedSignature = computeSignature(path.substring(0, start), secret)

  // compare computed signature with given signature
  return computedSignature === signature
}
