import { env } from './env'
import { isImageFormat, OptimizingParams } from './optimizeImage'

// IMAGE_ID_PATTERN should match starting and trailing slash.
// Because it is hard to verify this in the pattern itself we do it at runtime
const pathImageIdPattern = new RegExp(env('IMAGE_PATH_ID_PATTERN'))

export type PathParams = OptimizingParams & {
  id?: string
  error?: string
}

// parse params from path
// example: /path/to/image/uuid/webp/300x400/fp=200,100/crop=10,20,400,540

export const parsePath = (path: string): PathParams => {
  const match = path.match(pathImageIdPattern)
  if (!match) return { error: 'missing image id' }
  // if (!path.startsWith(match[0]))
  //   throw Error('IMAGE_PATH_ID_PATTERN must match leading and trailing slash')

  const id = match[1] // first group must be the image id
  const segments = path.substring(match[0].length).split('/')

  // go through all remaining segments and try to parse them, merge the results
  return segments.reduce<PathParams>(
    (params, segment) => ({ ...params, ...parseSegment(segment) }),
    { id }
  )
}

const parseSegment = (segment: string) =>
  ignoreEmptySegment(segment) ||
  parseFormat(segment) ||
  parseDimensions(segment) ||
  parseFocusPoint(segment) ||
  parseCropRectangle(segment) ||
  parseQuality(segment) ||
  parseBackground(segment) || { error: `invalid segment "${segment}"` }

const ignoreEmptySegment = (segment: string) => (!segment ? {} : undefined)

const parseFormat = (segment: string) => {
  return isImageFormat(segment) ? { format: segment } : undefined
}

const parseDimensions = (segment: string) => {
  if (segment.match(/^\d+$/)) return { width: parseInt(segment), height: NaN }
  const match = segment.match(/^(\d+)?x(\d+)?$/)
  if (!match) return undefined
  return { width: parseInt(match[1]), height: parseInt(match[2]) }
}

const parseFocusPoint = (segment: string) => {
  const match = segment.match(/^fp=(\d+),(\d+)$/)
  if (!match) return undefined
  return { focus: { x: parseInt(match[1]), y: parseInt(match[2]) } }
}

const parseCropRectangle = (segment: string) => {
  const match = segment.match(/^crop=(\d+),(\d+),(\d+),(\d+)$/)
  if (!match) return undefined
  return {
    crop: {
      x: parseInt(match[1]),
      y: parseInt(match[2]),
      width: parseInt(match[3]),
      height: parseInt(match[4]),
    },
  }
}

const parseQuality = (segment: string) => {
  const match = segment.match(/^q=(\d+)$/)
  if (!match) return undefined
  return { quality: parseInt(match[1]) }
}

const parseBackground = (segment: string) => {
  const match = segment.match(/^bg=([0-9a-f]{6})$/)
  if (!match) return undefined
  return { background: `#${match[1]}` }
}

const parseInt = (value: string | undefined) => Number.parseInt(value!) // parseInt(undefined) will return NaN
