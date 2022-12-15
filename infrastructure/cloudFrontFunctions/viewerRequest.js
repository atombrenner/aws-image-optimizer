// Note: This is a CloudFront function that uses a minimal CloudFront Javascript runtime
// see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-javascript-runtime-features.html

var crypto = require('crypto')

// the following values are replaced at deploy time, see stack.ts
var urlSigningSecret = '{{UrlSigningSecret}}'

var badRequest = {
  statusCode: 400,
  statusDescription: 'Bad Request',
  headers: { 'x-error': { value: 'invalid or missing signature' } },
}

function handler(event) {
  var request = event.request
  var path = request.uri

  // find signature part
  var start = path.lastIndexOf('/sig=')
  if (start < 0) return badRequest

  // extract signature
  var signature = path.substring(start).split('=')[1]
  if (!signature) return badRequest

  // extract remaining path
  var pathWithoutSignature = path.substring(0, start)

  // compare computed signature with given signature
  if (computeSignature(pathWithoutSignature) !== signature) return badRequest

  // modify request to not include the signature
  request.uri = pathWithoutSignature

  // TODO: we could sort path segments after ID prefix for optimal cache keys,
  // but the benefit is low if have uniform clients with signed urls

  // Do not try to implement content negotiation with the Accept header.
  // This increases complexity, leads to bad cache performance and other hard
  // to debug problems with browsers (e.g. Safari advertising support for webp but not really supporting it)
  // see https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation
  // and https://wiki.whatwg.org/wiki/Why_not_conneg

  return request
}

function computeSignature(s) {
  return crypto.createHmac('sha256', urlSigningSecret).update(s).digest('base64url')
}
