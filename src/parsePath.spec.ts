import { parsePath } from './parsePath'

// all transformation information is encoded in the image path
// Example: /path/to/image/45-a34fasd-4711/avif/400x300/342,344/434,34-234,234/
//          /$imagePath/$id/$format/$dimension/$crop

describe('parsePath', () => {
  it.each(['/path/to/image/UUID', '/path/to/image/UUID/', '/path/to/image/UUID/400x300'])(
    'should extract id from path %p',
    (path) => {
      const { id } = parsePath(path)
      expect(id).toEqual('UUID')
    }
  )

  it('should return falsy image id if path does not start with IMAGE_PATH', () => {
    expect(parsePath('/wrongpath/UUID').id).toBeFalsy()
  })

  it('should return falsy image id if path does not contain an image id', () => {
    expect(parsePath('/path/to/image/').id).toBeFalsy()
  })

  it('should return an error if path contains unparsable segments', () => {
    expect(parsePath('/path/to/image/webp/bla=123/fp=10,20')).toHaveProperty('error')
  })

  it.each([
    ['avif', '/path/to/image/UUID/avif'],
    ['webp', '/path/to/image/UUID/webp/'],
    ['jpeg', '/path/to/image/UUID/jpeg/400x300'],
  ])('should extract image type %p from from path %p', (expectedType, path) => {
    const { type } = parsePath(path)
    expect(type).toEqual(expectedType)
  })

  it.each([
    [{ width: 100, height: NaN }, '/path/to/image/UUID/jpeg/100'],
    [{ width: 200, height: NaN }, '/path/to/image/UUID/jpeg/200x'],
    [{ width: NaN, height: 300 }, '/path/to/image/UUID/jpeg/x300'],
    [{ width: 400, height: 300 }, '/path/to/image/UUID/jpeg/400x300'],
    [{}, '/path/to/image/UUID/jpeg'],
  ])('should extract dimensions %p from from path %p', (expectedDimension, path) => {
    const { width, height } = parsePath(path)
    expect({ width, height }).toEqual(expectedDimension)
  })

  it('should extract focus point', () => {
    const { focus } = parsePath('/path/to/image/UUID/fp=200,100')
    expect(focus).toEqual({ x: 200, y: 100 })
  })

  it('should extract crop rectangle', () => {
    const { crop } = parsePath('/path/to/image/UUID/crop=10,20,30,40')
    expect(crop).toEqual({ x: 10, y: 20, width: 30, height: 40 })
  })
})
