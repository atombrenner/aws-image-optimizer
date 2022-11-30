import { log } from '@atombrenner/log-json'
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { parseParams } from './parseParams'

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
    return await handleRequest(method, path)
  } catch (err) {
    log.error(err)
    return internalServerError
  }
}

export const handleRequest = async (method: string, path: string) => {
  if (!['GET', 'HEAD'].includes(method)) return methodNotAllowed

  const params = parseParams(path)
  if (!params) return badRequest

  //const data = loadOriginalImage()
  // if !data return 404

  // setupTransform
  // if Transform fails return 500

  // saveProcessedImage(event.rawPath, contentType, cacheControl)
  // return transformed Data

  return {
    statusCode: 200,
    headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=120' },
    body: Buffer.from(path).toString('base64'),
    isBase64Encoded: true,
  }
}

const response = (statusCode: number, body: string) => ({
  statusCode,
  headers: {
    'content-type': 'text/plain',
    'cache-control': 'public, max-age=120',
  },
  body,
  isBase64Encoded: false,
})

const badRequest = response(400, 'bad request')
const notFound = response(404, 'not found')
const methodNotAllowed = response(405, 'method not allowed')
const internalServerError = response(500, 'internal server error')
