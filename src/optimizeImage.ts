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
  // background?: string // background color in (#ffffff) to blend alpha channel with
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
    transformImage(image, { ...params, format: 'jpeg' }).catch(() => undefined),
  ])
  if (!results[1]) return results[0] // can't convert to jpeg, so let's hope that webp works
  return results[0].buffer.length < results[1].buffer.length ? results[0] : results[1]
}

const transformImage = async (image: Uint8Array, params: TransformParams) => {
  const sharpImage = sharp(image)
  const meta = await sharpImage.metadata()
  const size = getImageSize(meta)
  const {
    width = params.height ? 0 : 320,
    height = params.width ? 0 : 200,
    focus = defaultFocus(size),
    crop = defaultCrop(size),
    // background = params.format === 'jpeg', // for jpeg we need a default
    format,
  } = params

  // if (background) {
  //   sharpImage.flatten({ background }) // TODO: shall we use the meta.background color from the image?
  // }

  const ratio = width && height ? width / height : crop.width / crop.height
  const source = limitedRegion(focusCrop(ratio, focus, crop), size)
  const finalSize = limitedSize(width, height, ratio, source)
  const quality = params.quality || getQuality(format, finalSize)

  sharpImage.rotate() // normalize rotation
  sharpImage.extract(source)
  sharpImage.resize(finalSize)
  sharpImage[format]({ quality, mozjpeg: true }) // convert image format
  return { buffer: await sharpImage.toBuffer(), format }
}

// the bigger the image the more we can reduce quality
export const getQuality = (format: ImageFormat, size: Size): number => {
  const pixels = size.width * size.height
  if (format === 'jpeg' || format === 'webp') {
    if (pixels < 200 * 200) return 80
    if (pixels < 400 * 400) return 70
    if (pixels < 600 * 600) return 60
    if (pixels < 800 * 800) return 50
    return 40
  } else if (format === 'avif') {
    if (pixels < 400 * 400) return 50
    if (pixels < 800 * 800) return 42
    return 35
  }
  throw Error(`automatic quality for format ${format} not implemented`)
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

// calculate width and height so that the resulting region is fits into the source region
// because we don't want to artificially create images larger than the original
const limitedSize = (width: number, height: number, ratio: number, source: Size): Size => {
  if (!width) width = height * ratio
  if (!height) height = width / ratio
  if (width > source.width) {
    width = source.width
    height = source.width / ratio
  }
  if (height > source.height) {
    width = source.height * ratio
    height = width / ratio
  }
  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  }
}
