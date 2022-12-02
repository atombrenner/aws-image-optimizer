import { env } from './env'
import { ImageType, imageTypes, isImageType, ProcessingParams } from './processImage'

const imagePath = env('IMAGE_PATH')
if (!imagePath.endsWith('/') || !imagePath.startsWith('/'))
  throw Error(`IMAGE_PATH "${imagePath}" must start and end with a trailing slash "/"`)

export type PathParams = ProcessingParams & {
  id?: string
  error?: string
}

// parse params from path
// example: /path/to/image/uuid/webp/300x400/fp=200,100/crop=10,20,400,540

export const parsePath = (path: string): PathParams => {
  if (!path.startsWith(imagePath)) return { error: 'noPath' }

  const segments = path.substring(imagePath.length).split('/')
  const id = segments.shift() // first segment must be the image id

  // go through all segments and try to parse them, merge the results
  return segments.reduce<PathParams>(
    (params, segment) => ({ ...params, ...parseSegment(segment) }),
    { id }
  )
}

const parseSegment = (segment: string) =>
  parseType(segment) ||
  parseDimensions(segment) ||
  parseFocusPoint(segment) ||
  parseCropRectangle(segment) || { error: `invalid segment "${segment}"` }

const parseType = (segment: string) => {
  return isImageType(segment) ? { type: segment } : undefined
}

const parseDimensions = (segment: string) => {
  if (segment.match(/^\d+$/)) return { width: parseInt(segment) }
  const match = segment.match(/^(\d+)?x(\d+)?$/)
  return (
    match && {
      width: parseInt(match[1]) || undefined,
      height: parseInt(match[2]) || undefined,
    }
  )
}

const parseFocusPoint = (segment: string) => {
  const match = segment.match(/^fp=(\d+),(\d+)$/)
  return (
    match && {
      focus: { x: parseInt(match[1]), y: parseInt(match[2]) },
    }
  )
}

const parseCropRectangle = (segment: string) => {
  const match = segment.match(/^crop=(\d+),(\d+),(\d+),(\d+)$/)
  return (
    match && {
      crop: {
        x: parseInt(match[1]),
        y: parseInt(match[2]),
        width: parseInt(match[3]),
        height: parseInt(match[4]),
      },
    }
  )
}

const parseInt = (value: string) => Number.parseInt(value)
