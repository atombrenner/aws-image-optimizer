# AWS Image Optimizer

- can resize and crop images to arbitrary aspect ratios on the fly
- converts images to modern image formats _webp_ and _avif_ to reduce image size
- works well with [focus point based cropping](https://github.com/atombrenner/focus-crop-react)
- secure, fast and cheap implementation with AWS Cloudfront, S3 and Lambda
- completely serverless and scalable
- easy to integrate into existing projects that already store images in S3 buckets

## Architecture

![System Overview](/doc/overview.drawio.svg)

The heart of this solution is leveraging the ability of a CloudFront Origin Group
to first look up an image on an S3 bucket, and if not found retry the request
with a lambda function. The lambda function will read the original image,
transform it and then save and return the optimized image. That ensures that
every image is transformed only once, and all successive requests will be
either served from the CloudFront cache or the S3 Bucket (like a secondary cache).
Let's go through the details:

1. An image is requested.
2. A CloudFront Function can normalize the url path to improve the cache-hit-ratio.
   To prevent Denial-of-Wallet attacks it rejects unsigned urls.
   Both steps are optional if you want to start with a less complex system
3. CloudFront will forward the normalized and verified request to an Origin Group.
   An Origin Group acts like a normal origin but is composed of two origins.
   One is the primary origin. If this returns an error status code the
   request is retried with the secondary (failover) origin.
4. The request is forwarded to the S3 Bucket that stores optimized images.
   If found it will be returned and the request is complete.
5. If the S3 Bucket returns a 403 or 404 CloudFront will forward the request
   to our Image Optimizer Lambda. This is a straightforward lambda that utilizes
   a Lambda Function Url to handle web requests.
6. The lambda will extract some id from the path and read the original image from
   an S3 bucket. It uses sharp and libvips to optimize the image as specified
   by parameters encoded in the url path.
7. The optimized image is stored in the Optimized Images S3 Bucket for future requests
   and then returned to Cloudfront. The request is now complete.

Technical constraints: As we are limited by how an S3 bucket can act as a
CloudFront origin, we can use url parameters but have to encode all parameters into
the path. Which is actually easy, as each parameter just maps to a path segment.
Example: `https://example.com/some/IMAGEID/webp/100x200/fp=200,80/paramA=1/paramB=2`

This solution is very similar to what is written in this
[AWS blog post](https://aws.amazon.com/blogs/networking-and-content-delivery/image-optimization-using-amazon-cloudfront-and-aws-lambda/)
but was implemented without knowledge of it.

## Url structure

`/path/to/image/IDPATTERN/avif/400x300/fp=2000,1000/crop=0,0,4000,3000`

- starts with IDPATTERN (Regex, ID be spread over several segments, can help integrating legacy system, but not recommended)
- parameters don't have a fixed order
- easy extendible for more parameters, e.g. rotating, color manipulation, smart crop, ...

## Security

- original images can be never accessed, they live in a separate private buckeet
- metdata (which can contain PII data) is always removed
- url signing to prevent tampering urls (and therefore producing costs)
- security token to protect against direct calls

## Prerequisites

- run `npm ci`

## Commands

- `npm test` executes tests with jest
- `npm run build` creates ./dist/lambda.js bundle
- `npm run zip` creates the ./dist/lambda.zip from ./dist/lambda.js and ./dist/lambda.js.map
- `npm run dist` runs all of the above steps
- `npm run stack` creates or updates the CloudFormation stack
- `npm run deploy` used to deploy ./dist/lambda.zip to the created lambda function
- `npm start` will start the lambda function locally

## Configuration

The following environment variables must be specified. For `npm start` it is recommended
to create a `.env` file and also configure AWS credentials

| Environment Variable      | Explanation                                                                |
| ------------------------- | -------------------------------------------------------------------------- |
| `ORIGINAL_IMAGES_BUCKET`  | S3 bucket with orginal images (read only access)                           |
| `OPTIMIZED_IMAGES_BUCKET` | S3 bucket with optimized images (read write access)                        |
| `ORIGINAL_IMAGE_KEY`      | S3 key pattern for the original image, e.g. `image/${ID}/original`         |
| `IMAGE_PATH_ID_PATTERN`   | regex to extract path prefix and image id, e.g. `^/path/to/image/([^/]+)/` |
| `IMAGE_QUALITY`           | default image quality between 50..100, 80 is the recommended quality       |
| `CACHE_CONTROL`           | the Cache-Control header to set for optimized images                       |
| `SECURITY_TOKEN`          | configured in Cloudfront to prevent access without Cloudfront              |
| `SIGNED_URL_SECRET`       | secret for verifying signed urls                                           |
| `AWS\_\*`                 | configure AWS SDK, e.g. credentials or region, local development only      |

## Caveats

- **Building on a non-Linux environment:** Adjust the build process to include
  the correct native sharp and libvips library in the lambda artifact.
  See `infrastructure/zip.ts` and package.json prezip script.

- **Lambda Return Size Limit:** If an optimized image is very large (roughly 6MB),
  the Lambda function can't return a response. In this case, the result is still
  written to the optimized images bucket, and a 503 response with a [retry after header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After)
  is returned. On the next request, the image will be present on S3 and returned
  normally via CloudFront.

## Tools

- [sharp](https://github.com/lovell/sharp) high-performance image processing
- [ts-node](https://github.com/TypeStrong/ts-node) and [ts-node-dev](https://github.com/wclr/ts-node-dev) for running lambda locally
- [esbuild](https://esbuild.github.io/) fast Typescript transpiler and bundler
- [Jest](https://jestjs.io/) for testing
- [Babel](https://babeljs.io/) as a Jest transformer
- [Prettier](https://prettier.io/) for code formatting
- [Husky](https://github.com/typicode/husky) for managing git hooks, e.g. run tests before committing
- [@atombrenner/cfn-stack](https://github.com/atombrenner/cfn-stack) execute Cloudformation stacks with Typescript
