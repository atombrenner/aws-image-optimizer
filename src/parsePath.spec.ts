import { parsePath } from './parsePath'

describe('parseParams', () => {
  it.each(['/path/to/image/UUID', '/path/to/image/UUID/', '/path/to/image/UUID/400x300'])(
    'should extract original key from path %p',
    (path) => {
      const params = parsePath(path)
      expect(params?.originalKey).toEqual('path/to/image/UUID')
    }
  )
})
