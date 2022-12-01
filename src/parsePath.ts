import { env } from './env'

const imagePath = env('IMAGE_PATH')

if (!imagePath.endsWith('/') || !imagePath.startsWith('/'))
  throw Error(`IMAGE_PATH "${imagePath}" must start and end with a trailing slash "/"`)

export type Params = {
  originalPath?: string
  params?: {
    type: 'webp' | 'jpeg' | 'avif'
    width?: number
    height?: number
  }

  // width or height or both
  // cropArea
  // focuspoint
  // signature validation
}

// parse params from path
// example: /image/uuid/webp/300x400/342-344-434-34-234-234/signature

export const parsePath = (path: string): Params => {
  if (!path.startsWith(imagePath)) return {}
  const segments = path.substring(imagePath.length).split('/')
  const id = segments[0]
  return {
    originalPath: imagePath + id,
    params: {
      type: 'avif',
    },
  }
}
