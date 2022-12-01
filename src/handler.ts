import { log } from '@atombrenner/log-json'
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { env } from './env'
import { parsePath } from './parsePath'
import { processImage } from './processImage'
import { loadOriginalImage, saveProcessedImage } from './s3'

const securityToken = env('SECURITY_TOKEN')

// AWS Lambda Function Urls are reusing types from APIGateway
// but many fields are not used or filled with default values
// see: https://docs.aws.amazon.com/lambda/latest/dg/urls-invocation.html
// It would be nice to have types with only the used fields and add them to:
// https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/aws-lambda

export type LambdaFunctionUrlEvent = APIGatewayProxyEventV2
export type LambdaFunctionUrlResult = APIGatewayProxyStructuredResultV2

export const handler = async (event: LambdaFunctionUrlEvent): Promise<LambdaFunctionUrlResult> => {
  try {
    const method = event.requestContext.http.method
    const path = event.rawPath
    log.info(`${method} ${path}`)

    if (event.headers['x-security-token'] !== securityToken) {
      log.warn('wrong or missing security token')
      return forbidden
    }

    return await handleRequest(method, path)
  } catch (err) {
    log.error(err)
    return internalServerError
  }
}

const cacheControl = env('CACHE_CONTROL')

export const handleRequest = async (
  method: string,
  path: string
): Promise<LambdaFunctionUrlResult> => {
  if (!['GET', 'HEAD'].includes(method)) return methodNotAllowed

  const { id, error, ...params } = parsePath(path)
  if (!id) return notFound
  if (error) return badRequest

  const original = await loadOriginalImage(id)
  if (!original) return notFound

  const processed = await processImage(original, params)
  const contentType = `image/${params.type}`
  const headers = { 'content-type': contentType, 'cache-control': cacheControl }
  await saveProcessedImage(path, processed, contentType, cacheControl)

  if (method === 'HEAD') return { statusCode: 200, headers }

  const body = processed.toString('base64')

  // can't return large response via lambda, but retry will be served from S3
  if (body.length > 5 * 1024 * 1024) return retryLater

  return { statusCode: 200, headers, body, isBase64Encoded: true }
}

const textResponse = (statusCode: number, body: string) => ({
  statusCode,
  headers: {
    'content-type': 'text/plain',
    'cache-control': `public, max-age=${statusCode < 500 ? 300 : 60}`,
  },
  body,
  isBase64Encoded: false,
})

const badRequest = textResponse(400, 'bad request')
const forbidden = textResponse(403, 'forbidden')
const notFound = textResponse(404, 'not found')
const methodNotAllowed = textResponse(405, 'method not allowed')
const internalServerError = textResponse(500, 'internal server error')
const retryLater = {
  statusCode: 503,
  headers: { 'retry-after': '1', 'cache-control': 'no-cache, no-store' },
}
