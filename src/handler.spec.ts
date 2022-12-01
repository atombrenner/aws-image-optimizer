import { handler, handleRequest, LambdaFunctionUrlEvent } from './handler'

describe('handler', () => {
  it('should catch all exceptions', async () => {
    const response = await handler({} as LambdaFunctionUrlEvent)
    expect(response.statusCode).toEqual(500)
  })

  it('should return forbidden if x-security-token is wrong', async () => {
    const response = await handler({
      requestContext: { http: { method: 'GET' } },
      rawPath: '/path/to/image/UUID',
      headers: { 'x-security-token': 'invalid' } as LambdaFunctionUrlEvent['headers'],
    } as LambdaFunctionUrlEvent)
    expect(response.statusCode).toEqual(403)
  })
})

describe('handleRequest', () => {
  it.each(['DELETE', 'POST', 'PUT', 'OPTION'])(
    'should return 405 Method Not Allowed for method %p',
    async (method) => {
      const response = await handleRequest(method, '/')
      expect(response.statusCode).toEqual(405)
    }
  )
})
