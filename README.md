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
2. Optional: the URL signature is verified by a CloudFront Function.
   If invalid the request is rejected with a 400 status code. This protects
   against Denial-of-Wallet attacks.
3. CloudFront will forward the verified request to an Origin Group.
   An Origin Group acts like a normal origin but is composed of two origins.
   One is the primary origin. If this returns an error status code the
   request is retried with the secondary (failover) origin.
4. The request is forwarded to the S3 Bucket that stores optimized images.
   If found it will be returned and the request is complete.
5. If the S3 Bucket returns a 403 or 404 CloudFront will forward the request
   to our Image Optimizer Lambda which has a Lambda Function Url, no
   extra API Gateway or ALB is necessary. Cloudfront will add an
   X-Security-Token header to each request.
6. The Lambda Function first verifies the X-Security-Token header to prevent
   direct access (from bots or attackers). Then it reads the original image
   from an S3 bucket and optimizes it by using sharp and libvips.
7. The optimized image is stored in the Optimized Images S3 Bucket for future
   requests. It is also returned directly to Cloudfront.
   The request is now complete.

Technical constraints: As we are limited by how an S3 bucket can act as a
CloudFront origin, we can use URL parameters but have to encode all parameters into
the path. Which is easy, as each parameter just maps to a path segment.
Example: `https://example.com/some/IMAGEID/webp/100x200/fp=200,80/paramA=1/paramB=2`

This solution is very similar to what is written in this
[AWS blog post](https://aws.amazon.com/blogs/networking-and-content-delivery/image-optimization-using-amazon-cloudfront-and-aws-lambda/)
but was implemented without knowledge of it.

## URL path structure

Example: `/image/ab5234-2346-ab34f/avif/400x300/fp=2000,1000/crop=0,0,4000,3000`

The start of the path contains the image id. Each following path segment encodes one parameter. (path segments are delimited by `/`).

Often the id will be prefixed or postfixed by arbitrary strings. For more flexibility, we use a regex, `IMAGE_PATH_ID_PATTERN`, to specify how
to extract the id from the path. The regex must match the beginning of the path
and the first group must capture the id. In the above example, we would use the `^/image/([^/]+)/` regex to capture the first segment after `image`.
With more complex patterns the id can span multiple segments.
To build the key for accessing the original image, we need the `ORIGINAL_IMAGE_KEY`
parameter, e.g. `foo/${ID}/bar`. The `${ID}` will be replaced by the extracted id
from the path.

### Parameters

| Parameter   | Explanation                     | Example                | Default                                                                  |
| ----------- | ------------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| format      | `jpeg` or `webp` or `avif`      | `/avif`                | `webp`                                                                   |
| dimensions  | `<width>x<height`>              | `/800x600`             | `320x200`                                                                |
| width only  | `<width>` or `<width>x`         | `/800`                 | `<height>` calculated to keep original aspect ratio                      |
| height only | `x<height>`                     | `/x600`                | `<width>` calculated to keep original aspect ratio                       |
| focus point | `fp=<x>,<y>`                    | `/fp=2000,1200`        | `<x>` is half of original width and `<y>` is one third of orginal height |
| cropping    | `crop=<x>,<y>,<width>,<height>` | `/crop=96,0,3904,2850` | original image size                                                      |
| quality     | `q=<50..100>`                   | `/q=80`                | `IMAGE_QUALITY` environment variable                                     |

## Security

- original images can be never accessed, they live in a separate private bucket
- metdata (which can contain PII data) is always removed
- URL signing to prevent tampering URLs (and therefore producing costs)
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
