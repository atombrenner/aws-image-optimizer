# AWS Serverless Image Optimizer

- resize and crop images to arbitrary aspect ratios on the fly
- convert to web optimized formats like webp and avif to reduce image size
- works well with [focus point based cropping](https://github.com/atombrenner/focus-crop-react).
- secure, fast and cheap implementation with AWS Cloudfront, S3 and Lambda
- easy to integrate into existing AWS projects

## Architecture

The architecture is very similar to what is written in this [AWS blog post](https://aws.amazon.com/blogs/networking-and-content-delivery/image-optimization-using-amazon-cloudfront-and-aws-lambda/).

## Prerequisites

- run `npm ci`

## Caveats

If you build on a non-Linux environment, adjust the build process to include
the correct native sharp and libvips library in the lambda artifact.
See `infrastructure/zip.ts` and package.json prezip script.

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

## Tools

- [sharp](https://github.com/lovell/sharp) high-performance image processing
- [ts-node](https://github.com/TypeStrong/ts-node) and [ts-node-dev](https://github.com/wclr/ts-node-dev) for running lambda locally
- [esbuild](https://esbuild.github.io/) fast Typescript transpiler and bundler
- [Jest](https://jestjs.io/) for testing
- [Babel](https://babeljs.io/) as a Jest transformer
- [Prettier](https://prettier.io/) for code formatting
- [Husky](https://github.com/typicode/husky) for managing git hooks, e.g. run tests before committing
- [@atombrenner/cfn-stack](https://github.com/atombrenner/cfn-stack) execute Cloudformation stacks with Typescript
