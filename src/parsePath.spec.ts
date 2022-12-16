import { parsePath } from './parsePath'

// parse params from path
// example: /path/to/image/uuid/webp/300x400/fp=200,100/crop=10,20,400,540

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
    const { format, error } = parsePath(path)
    expect(format).toEqual(expectedType)
    expect(error).toBeUndefined()
  })

  it.each([
    [{ width: 100, height: NaN }, '/path/to/image/UUID/jpeg/100'],
    [{ width: 200, height: NaN }, '/path/to/image/UUID/jpeg/200x'],
    [{ width: NaN, height: 300 }, '/path/to/image/UUID/jpeg/x300'],
    [{ width: 400, height: 300 }, '/path/to/image/UUID/jpeg/400x300'],
    [{}, '/path/to/image/UUID/jpeg'],
  ])('should extract dimensions %p from from path %p', (expectedDimension, path) => {
    const { width, height, error } = parsePath(path)
    expect({ width, height }).toEqual(expectedDimension)
    expect(error).toBeUndefined()
  })

  it('should extract focus point', () => {
    const { focus, error } = parsePath('/path/to/image/UUID/fp=200,100')
    expect(focus).toEqual({ x: 200, y: 100 })
    expect(error).toBeUndefined()
  })

  it('should extract crop rectangle', () => {
    const { crop, error } = parsePath('/path/to/image/UUID/fp=200,100/crop=10,20,30,40')
    expect(crop).toEqual({ x: 10, y: 20, width: 30, height: 40 })
    expect(error).toBeUndefined()
  })

  it('should ignore empty segments', () => {
    const params = parsePath('/path/to/image/UUID/fp=200,100///100x200/')
    expect(params).toEqual({ id: 'UUID', focus: { x: 200, y: 100 }, width: 100, height: 200 })
  })

  it('should extract quality parameter', () => {
    const { quality, error } = parsePath('/path/to/image/UUID/q=50')
    expect(quality).toEqual(50)
    expect(error).toBeUndefined()
  })
})
