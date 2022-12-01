import { env } from './env'
import { imageTypes, ProcessingParams } from './processImage'

const imagePath = env('IMAGE_PATH')
if (!imagePath.endsWith('/') || !imagePath.startsWith('/'))
  throw Error(`IMAGE_PATH "${imagePath}" must start and end with a trailing slash "/"`)

export type Params = ProcessingParams & {
  id?: string
}

// parse params from path
// example: /path/to/image/uuid/webp/300x400/342-344-434-34-234-234

export const parsePath = (path: string): Params => {
  if (!path.startsWith(imagePath)) return {}

  const segments = path.substring(imagePath.length).split('/')
  const id = segments[0] ? segments[0] : undefined
  const type = imageTypes.includes(segments[1]) ? segments[1] : undefined
  const { width, height } = parseDimensions(segments[2])

  return {
    id,
    type,
    width,
    height,
  }
}

const parseDimensions = (dimensions: string) => {
  if (!dimensions) return {}
  const [w, h] = dimensions.split('x')
  return {
    width: Number.parseInt(w) || undefined,
    height: Number.parseInt(h) || undefined,
  }
}
