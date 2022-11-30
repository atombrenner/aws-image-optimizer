import { createServer, IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import { log } from '@atombrenner/log-json'
import { handler, LambdaFunctionUrlEvent } from './handler'

function writeTextResponse(res: ServerResponse, status: number, text: string) {
  writeResponse(res, status, text, 'text/plain')
}

function writeResponse(res: ServerResponse, status: number, body: any, type: string) {
  res.writeHead(status, { 'content-type': type })
  res.end(body)
}

function makeLambdaFunctionUrlEvent(req: IncomingMessage): LambdaFunctionUrlEvent {
  if (!req.url) throw Error('missing url')
  const url = new URL(req.url!, 'https://examples.com')
  return {
    requestContext: { http: { method: req.method } },
    rawPath: url.pathname,
    rawQueryString: '',
  } as LambdaFunctionUrlEvent
}

function handleNodeRequest(req: IncomingMessage, res: ServerResponse) {
  try {
    handler(makeLambdaFunctionUrlEvent(req)).then((response) => {
      res.writeHead(response.statusCode ?? 500, (response.headers ?? {}) as OutgoingHttpHeaders)
      res.end(response.body, response.isBase64Encoded ? 'base64' : 'utf-8')
    })
  } catch (error) {
    log.error('handleNodeRequest failed', error)
    writeTextResponse(res, 500, 'Internal Server Error')
  }
}

const shutdown = () => process.exit(0)
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
process.on('unhandledRejection', (err, promise) => {
  log.error(`unhandledRejection ${promise}`, err)
})

const port = 8080
createServer(handleNodeRequest).listen(port, () => {
  log.info(`listening @ http://localhost:${port}`)
})
