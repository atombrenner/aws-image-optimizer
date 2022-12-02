import sharp, { Metadata, Region } from 'sharp'
import { env } from './env'
import { focusCrop, Point, Rectangle, Size } from './focusCrop'

const quality = Number.parseInt(env('IMAGE_QUALITY'))

export const imageTypes = ['webp', 'jpeg', 'avif'] as const
export type ImageType = typeof imageTypes[number]
export const isImageType = (value: unknown): value is ImageType =>
  imageTypes.includes(value as ImageType)

export type ProcessingParams = {
  type?: ImageType
  width?: number
  height?: number
  focus?: Point
  crop?: Rectangle
}

export const processImage = async (image: Uint8Array, params: ProcessingParams) => {
  const sharpImage = sharp(image)
  const size = getImageSize(await sharpImage.metadata())
  const {
    width = params.height ? 0 : 320,
    height = params.width ? 0 : 200,
    focus = defaultFocus(size),
    crop = defaultCrop(size),
    type = 'webp',
  } = params

  const ratio = width && height ? width / height : size.width / size.height
  const source = region(focusCrop(ratio, focus, crop), size)
  sharpImage.rotate() // normalize rotation
  sharpImage.extract(source)
  sharpImage.resize(limitSize(width, height, ratio, source))
  sharpImage[type]({ quality }) // convert image format
  return { type, processed: await sharpImage.toBuffer() }
}

const getImageSize = ({ width, height, orientation }: Metadata) => {
  if (!width || !height) throw Error('original image has no size')
  // if present, orientation is 1 2 3 4 5 6 7 8 and describes rotation and mirroring, see https://exiftool.org/TagNames/EXIF.html
  return orientation && orientation <= 4 ? { width, height } : { width: height, height: width }
}

const defaultFocus = (size: Size) => ({
  x: size.width / 2,
  y: size.height / 3,
})

const defaultCrop = (size: Size) => ({
  x: 0,
  y: 0,
  width: size.width,
  height: size.height,
})

const region = (rect: Rectangle, max: Size): Region => ({
  left: Math.max(0, Math.round(rect.x)),
  top: Math.max(0, Math.round(rect.y)),
  width: Math.min(max.width, Math.round(rect.width)),
  height: Math.min(max.height, Math.round(rect.height)),
})

// // calclulate a width so that the resulting region fits the original image (we don't want to artificially blow up small images)
function limitSize(width: number, height: number, ratio: number, max: Size) {
  if (!width) width = height * ratio
  if (!height) height = width / ratio
  if (width > max.width) {
    width = max.width
    height = max.width / ratio
  }
  if (height > max.height) {
    width = max.height * ratio
    height = width / ratio
  }
  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  }
}
