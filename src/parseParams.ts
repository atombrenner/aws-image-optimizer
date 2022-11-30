import { env } from './env'

const pathPrefix = env('PATH_PREFIX', '/')

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
  return {}
}
