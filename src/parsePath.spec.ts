import { parsePath } from './parsePath'

// all transformation information is encoded in the image path
// Example: /path/to/image/45-a34fasd-4711/avif/400x300/10,20-5000,4000-1000,1000
//          /$imagePath/$id/$format/$dimension/$crop

describe('parsePath', () => {
  it.each(['/path/to/image/UUID', '/path/to/image/UUID/', '/path/to/image/UUID/400x300'])(
    'should extract id from path %p',
    (path) => {
      const { id } = parsePath(path)
      expect(id).toEqual('UUID')
    }
  )

  it('should not extract image id if path does not start with IMAGE_PATH', () => {
    expect(parsePath('/wrongpath/UUID').id).toBeUndefined()
  })

  it('should not extract image id if path does contain an image id', () => {
    expect(parsePath('/path/to/image/').id).toBeUndefined()
  })

  it.each([
    ['avif', '/path/to/image/UUID/avif'],
    ['webp', '/path/to/image/UUID/webp/'],
    ['jpeg', '/path/to/image/UUID/jpeg/400x300'],
  ])('should extract image type %p from from path %p', (expectedType, path) => {
    const { type } = parsePath(path)
    expect(type).toEqual(expectedType)
  })

  it.each(['/path/to/image/UUID/', 'path/to/imgage/UUID/png'])(
    'should not extract image type if image type is not valid',
    (path) => {
      const { type } = parsePath(path)
      expect(type).toBeUndefined()
    }
  )

  it.each([
    [{ width: 400, height: 300 }, '/path/to/image/UUID/avif/400x300'],
    [{ height: 200 }, '/path/to/image/UUID/webp/x200'],
    [{ width: 100 }, '/path/to/image/UUID/jpeg/100'],
  ])('should extract dimensions %p from from path %p', (expectedDimension, path) => {
    const { width, height } = parsePath(path)
    expect({ width, height }).toEqual(expectedDimension)
  })
})
