// Algorithm for calculating a rectangle with a desired ratio centered around a focus point
// copied from https://github.com/atombrenner/focus-crop-react/blob/main/src/lib/focusCrop.ts

export type Point = {
  x: number
  y: number
}

export type Size = {
  width: number
  height: number
}

export type Rectangle = Point & Size

/**
 *  Calculates a rectangle with a desired ratio centered around a focus point
 *  from a source rectangle. The calculated rectangle has either the same
 *  width or the same height of the source rectangle.
 */
export const focusCrop = (ratio: number, focus: Point, crop: Rectangle): Rectangle => {
  // depending on the ratio keep either the width or the height of the clip rectangle
  // and calculate the other dimension from the desired ratio
  const clipRatio = crop.width / crop.height
  if (clipRatio < ratio) {
    const newHeight = crop.width / ratio
    // calculate top of rect centered around focus point y
    const newY = centered(focus.y, newHeight, crop.y, crop.y + crop.height)
    return { x: crop.x, y: newY, width: crop.width, height: newHeight }
  } else {
    const newWidth = crop.height * ratio
    // calculate left of rect centered around focus point x
    const newX = centered(focus.x, newWidth, crop.x, crop.x + crop.width)
    return { x: newX, y: crop.y, width: newWidth, height: crop.height }
  }
}

const centered = (center: number, length: number, min: number, max: number): number => {
  const start = center - length / 2
  return Math.min(Math.max(start, min) + length, max) - length
}
