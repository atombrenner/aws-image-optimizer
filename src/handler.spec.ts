import { handler, handleRequest, LambdaFunctionUrlEvent } from './handler'

describe('handler', () => {
  it('should catch all exceptions', async () => {
    const response = await handler({ rawPath: '/image/id' } as LambdaFunctionUrlEvent)
    expect(response.statusCode).toEqual(500)
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
