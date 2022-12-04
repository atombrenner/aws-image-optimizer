import { env } from './env'
import { isImageType, OptimizingParams } from './optimizeImage'

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
  parseType(segment) ||
  parseDimensions(segment) ||
  parseFocusPoint(segment) ||
  parseCropRectangle(segment) || { error: `invalid segment "${segment}"` }

const ignoreEmptySegment = (segment: string) => (!segment ? {} : undefined)

const parseType = (segment: string) => {
  return isImageType(segment) ? { type: segment } : undefined
}

const parseDimensions = (segment: string) => {
  if (segment.match(/^\d+$/)) return { width: parseInt(segment), height: NaN }
  const match = segment.match(/^(\d+)?x(\d+)?$/)
  return (
    match && {
      width: parseInt(match[1]),
      height: parseInt(match[2]),
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

const parseInt = (value: string | undefined) => Number.parseInt(value!) // parseInt(undefined) will return NaN
