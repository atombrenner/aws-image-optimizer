import sharp, { Metadata, Region } from 'sharp'
import { focusCrop, Point, Rectangle, Size } from './focusCrop'

export const imageFormats = ['webp', 'jpeg', 'avif'] as const
export type ImageFormat = typeof imageFormats[number]
export const isImageFormat = (value: unknown): value is ImageFormat =>
  imageFormats.includes(value as ImageFormat)

type TransformParams = {
  format: ImageFormat
  width?: number
  height?: number
  focus?: Point
  crop?: Rectangle
  quality?: number
}

export type OptimizingParams = Partial<TransformParams>

export const optimizeImage = async (image: Uint8Array, params: OptimizingParams) => {
  if (params.format) return transformImage(image, params as TransformParams)

  // The compression between webp and jpeg (mozjpg) is very similiar.
  // actually, for photos with lots of details mozjpg produces smaller images
  // and for low detail images (screenshots, diagrams, ...) webp produces smaller ones.
  // Because jpeg and webp are supported by all modern browsers, we can
  // pick the format that has the best compression, if no format was specified.
  const results = await Promise.all([
    transformImage(image, { ...params, format: 'webp' }),
    transformImage(image, { ...params, format: 'jpeg' }),
  ])
  return results[0].buffer.length < results[1].buffer.length ? results[0] : results[1]
}

export const transformImage = async (image: Uint8Array, params: TransformParams) => {
  const sharpImage = sharp(image)
  const size = getImageSize(await sharpImage.metadata())
  const {
    width = params.height ? 0 : 320,
    height = params.width ? 0 : 200,
    focus = defaultFocus(size),
    crop = defaultCrop(size),
    format,
    quality,
  } = params

  const ratio = width && height ? width / height : crop.width / crop.height
  const source = limitedRegion(focusCrop(ratio, focus, crop), size)
  sharpImage.rotate() // normalize rotation
  sharpImage.extract(source)
  sharpImage.resize(limitedWidth(width, height, ratio, source))
  sharpImage[format]({ quality, mozjpeg: true }) // convert image format
  return { buffer: await sharpImage.toBuffer(), format }
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
