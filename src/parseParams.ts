import { env } from './env'

const imagePath = env('IMAGE_PATH')

if (!imagePath.endsWith('/') || !imagePath.startsWith('/'))
  throw Error(`IMAGE_PATH "${imagePath}" must start and end with a trailing slash "/"`)

export type Params = {
  prefix: string
  id: string
  type: 'webp' | 'jpg' | 'avif'
  // width or height or both
  // cropArea
  // focuspoint
  // signature validation
}

// parse params from path
// example: /image/uuid/webp/300x400/342-344-434-34-234-234/signature

export const parseParams = (path: string) => {
  console.log(imagePath)
  if (!path.startsWith(imagePath)) return undefined
  const segments = path.substring(imagePath.length).split('/')
  console.log('image/' + segments[0])
  return {
    originalKey: 'image/' + segments[0],
    contentType: 'image/webp',
  }
}
