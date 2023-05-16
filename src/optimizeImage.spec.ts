import { Metadata } from 'sharp'
import { getImageSize, limitedRegion } from './optimizeImage'

describe('getImageSize', () => {
  it.each([undefined, 1, 2, 3, 4])(
    'should return normal image size for orientation % p',
    (orientation) => {
      const size = getImageSize({ width: 400, height: 300, orientation } as Metadata)
      expect(size).toEqual({ width: 400, height: 300 })
    }
  )
  it.each([5, 6, 7, 8])('should return rotated image size for orientation %p', (orientation) => {
    const size = getImageSize({ width: 400, height: 300, orientation } as Metadata)
    expect(size).toEqual({ width: 300, height: 400 })
  })
})

describe('limitedRegion', () => {
  it('should limit a region to fit into the given image size (real life example)', () => {
    const region = limitedRegion(
      { x: 0, y: 1012.5, width: 5400, height: 3037.5 }, // not fractional height that can lead to rounding errors
      { width: 5400, height: 4050 }
    )
    expect(region).toEqual({ left: 0, top: 1013, width: 5400, height: 3037 })
  })
  it(`should limit a region to fit into the given image size`, () => {
    const region = limitedRegion(
      { x: -1, y: -1, width: 102, height: 202 }, // not fractional height that can lead to rounding errors
      { width: 100, height: 200 }
    )
    expect(region).toEqual({ left: 0, top: 0, width: 100, height: 200 })
  })
})
