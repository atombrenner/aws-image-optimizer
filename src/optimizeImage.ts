import sharp, { Metadata, Region } from 'sharp'
import { focusCrop, Point, Rectangle, Size } from './focusCrop'

export const imageTypes = ['webp', 'jpeg', 'avif'] as const
export type ImageType = typeof imageTypes[number]
export const isImageType = (value: unknown): value is ImageType =>
  imageTypes.includes(value as ImageType)

export type OptimizingParams = {
  type?: ImageType
  width?: number
  height?: number
  focus?: Point
  crop?: Rectangle
  quality?: number
}

export const optimizeImage = async (image: Uint8Array, params: OptimizingParams) => {
  const sharpImage = sharp(image)
  const size = getImageSize(await sharpImage.metadata())
  const {
    width = params.height ? 0 : 320,
    height = params.width ? 0 : 200,
    focus = defaultFocus(size),
    crop = defaultCrop(size),
    type = 'webp',
    quality,
  } = params

  const ratio = width && height ? width / height : crop.width / crop.height
  const source = limitedRegion(focusCrop(ratio, focus, crop), size)
  sharpImage.rotate() // normalize rotation
  sharpImage.extract(source)
  sharpImage.resize(limitedWidth(width, height, ratio, source))
  sharpImage[type]({ quality }) // convert image format
  return { type, optimized: await sharpImage.toBuffer() }
}

export const getImageSize = ({ width, height, orientation }: Metadata) => {
  if (!width || !height) throw Error('original image has no size')
  // if present, orientation is 1 2 3 4 5 6 7 8 and describes rotation and mirroring, see https://exiftool.org/TagNames/EXIF.html
  return orientation && orientation > 4 && orientation <= 8
    ? { width: height, height: width } // rotate 90 degrees for orientation 5, 6, 7 and 8
    : { width, height } // do nothing for all other values, including undefined, NaN, ...
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

// calculate a region from a Rectangle that lies inside the original image (round to pixels)
const limitedRegion = (rect: Rectangle, max: Size): Region => ({
  left: Math.max(0, Math.round(rect.x)),
  top: Math.max(0, Math.round(rect.y)),
  width: Math.min(max.width, Math.round(rect.width)),
  height: Math.min(max.height, Math.round(rect.height)),
})

// // calclulate a width so that the resulting region is smaller or equal the max size (we don't want to artificially blow up small images)
function limitedWidth(width: number, height: number, ratio: number, max: Size) {
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
