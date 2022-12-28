# AWS Image Optimizer

- can resize and crop images to arbitrary aspect ratios on the fly
- converts images to modern image formats `webp` and `avif` to reduce image size
- works well with [focus-point based cropping](https://github.com/atombrenner/focus-crop-react)
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

The start of the path contains the image id. Often it is prefixed or postfixed
by arbitrary strings. To be flexible, we use a regex, `IMAGE_PATH_ID_PATTERN`
to extract the id. The regex must match the beginning of the path and the first
group must capture the id. In the above example, we would use the pattern
`^/image/([^/]+)/` to capture the first segment after `/image/`. With more
complex patterns the id can even span multiple segments.

Once we have the id of the original image, we need to construct the key of
the original image. The `ORIGINAL_IMAGE_KEY` environment variable defines a
key template, e.g. `foo/${ID}/bar`, where the `${ID}` is replaced with the
extracted id.

All segments after the `IMAGE_PATH_ID_PATTERN` are encoded parameters.
(Path segments are delimited by `/`). As the path of the request equals
the S3 key for the optimized image, we can't use query parameters but need
path parameters. Conceptually they are the same, but path parameters are
easier to use and build (no CloudFront whitelisting for example).
If you don't like this approach you can use a CloudFront function to
convert query parameters to path parameters.

| Parameter   | Explanation                     | Example                | Default                                       |
| ----------- | ------------------------------- | ---------------------- | --------------------------------------------- |
| format      | `jpeg` or `webp` or `avif`      | `/avif`                | pick smallest `jpeg` or `webp` impage         |
| dimensions  | `<width>x<height`>              | `/800x600`             | `320x200`                                     |
| width only  | `<width>` or `<width>x`         | `/800`                 | height calculated to keep source aspect ratio |
| height only | `x<height>`                     | `/x600`                | width calculated to keep source aspect ratio  |
| focus point | `fp=<x>,<y>`                    | `/fp=2000,1200`        | (original_width / 2), (original_height / 3)   |
| cropping    | `crop=<x>,<y>,<width>,<height>` | `/crop=96,0,3904,2850` | original image size                           |
| quality     | `q=<0..100>`                    | `/q=80`                | automatic, depending on imagesize and format  |

Jpeg encoding uses `mozjpg` settings, so it has a similiar compression ratio as `webp` for photos.
If you don't specify a format, the image optimizer will internally try
`webp` and `jpeg`. The format that produces the smallest image will be chosen and returned.

- [Is WebP better than JPEG?](https://siipo.la/blog/is-webp-really-better-than-jpeg)
- [Modern Data Compression in 2021](https://chipsandcheese.com/2021/02/28/modern-data-compression-in-2021-part-2-the-battle-to-dethrone-jpeg-with-jpeg-xl-avif-and-webp/)

## Supported Image Formats

On purpose only general purpose image formats are supported:

- `jpeg` (with `mozjpg` settings)
- `webp` (similar to `jpeg` and always better than `png` or `gif`)
- `avif` (better compression than above, but slow and in some edge cases I noticed problems with visual quality)
- coming soon: `jxl` excellent compression, quality and speed

For `jpeg` format the `mozjpg` settings are used which give us a comparable or better compression than `webp`.
Because `jpeg` and `webp` are widespread I recommend not specifying a format and letting the image
optimizer pick the one that produces the smallest image.

## Cost effective

Each image will be generated only once and stored on S3.
An S3 lifetime policy will remove optimized images after a while (300 days by default).
If the image is still in use it will be optimized at max every 300 days.
This could even improve quality because in the meantime encoders probably improved.

## Security

- original images can be never accessed from the outside, they live in a separate private bucket
- metadata (which can contain PII data) is always removed in optimized images
- security token to protect against direct calls of the Lambda Function URL
- URL signing to prevent malicious tampering

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
- `npm sign <path> [secret]`

## Configuration

The following environment variables must be specified. For `npm start` it is recommended
to create a `.env` file and also configure AWS credentials

| Environment Variable      | Explanation                                                                 |
| ------------------------- | --------------------------------------------------------------------------- |
| `ORIGINAL_IMAGES_BUCKET`  | S3 bucket with orginal images (read only access)                            |
| `OPTIMIZED_IMAGES_BUCKET` | S3 bucket with optimized images (read write access)                         |
| `ORIGINAL_IMAGE_KEY`      | S3 key pattern for the original image, e.g. `image/${ID}/original`          |
| `IMAGE_PATH_ID_PATTERN`   | regex to extract path prefix and image id, e.g. `^/path/to/image/([^/]+)/`  |
| `CACHE_CONTROL`           | the Cache-Control header to set for optimized images                        |
| `SECURITY_TOKEN`          | configured in Cloudfront to prevent direct lambda access without Cloudfront |
| `AWS\_\*`                 | configure AWS SDK, e.g. credentials or region, for local development only   |

## URL Signing

URL Signing is done by a CloudFront Function. It needs a secret that is shared between the client who signs
an URL and CloudFront that verifies the signature. Because CloudFront Functions don't have environment variables,
we embed the secret directly in the source code of the CloudFront Function.
See [stack.ts](infrastructure/stack.ts) and [viewerRequest.js](infrastructure/cloudFrontFunctions/viewerRequest.js)
for an implementation that reads it from [Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html).
You should configure a parameter with the name `image-optimizer-url-signing-secret` to store the secret.

When you use URL signing each image URL must be signed. If you don't use it, you must remove
the CloudFront Function. If you use it, it is your responsibility to give the URL builder secure access
to the shared secret. If for example some code (think React) runs in the browser and creates URLs (e.g.
set image srcset), signing is no longer useful as the secret is visible in the browser and can be easily stolen.
Only if you can guarantee that all URLs are signed in a secure environment (server) URL signing makes sense.

## Caveats

- **Building on a non-Linux environment:** Adjust the build process to include
  the correct native sharp and libvips library in the lambda artifact.
  See `infrastructure/zip.ts` and package.json prezip script.

- **Lambda Return Size Limit:** If an optimized image is very large (roughly 6MB),
  the Lambda function can't return a response. In this case, the result is still
  written to the optimized images bucket, and a 503 response with a
  [retry-after header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After)
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
