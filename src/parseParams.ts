import { env } from './env'

const pathPrefix = '/image/' // env('PATH_PREFIX', '/')
if (!pathPrefix.endsWith('/'))
  throw Error(`PATH_PREFIX "${pathPrefix}" must end with a trailing slash "/"`)

export type Params = {
  prefix: string
  id: string
  type: 'webp' | 'jpg' | 'avif'
  // width or height or both
  // cropArea
  // focuspoint
  // signature validation
}

// parse params from path
// example: /image/uuid/webp/300x400/342-344-434-34-234-234/signature

export const parseParams = (path: string) => {
  if (!path.startsWith(pathPrefix)) return undefined
  const segments = path.substring(pathPrefix.length).split('/')
  console.log('image/' + segments[0])
  return {
    originalKey: 'image/' + segments[0],
    contentType: 'image/webp',
  }
}
