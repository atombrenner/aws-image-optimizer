import { Metadata } from 'sharp'
import { getImageSize } from './optimizeImage'

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
