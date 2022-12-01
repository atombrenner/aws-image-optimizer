# AWS Web Image Optimizer

Converts and crops large images to web-optimized formats like webp or avif in one step to reduce image size.
Works well with [focus point cropping](https://github.com/atombrenner/focus-crop-react).

## Prerequisites

- run `npm ci`

## Caveats

If you build this on a non-Linux environment, adjust the build process to include
the correct native sharp and libvips library in the bundle. See `infrastructure/zip.ts`
and package.json prezip script.

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

| Environment Variable  | Explanation                                                           |
| --------------------- | --------------------------------------------------------------------- |
| `ORIGINAL_BUCKET`     | S3 bucket with orginal images                                         |
| `ORIGINAL_KEY_PREFIX` | e.g. `image/` S3 key prefix for loading originalmage                  |
| `PROCESSED_BUCKET`    | S3 bucket to store processed images                                   |
| `IMAGE_PATH`          | e.g. `/` or `/path/to/image/`, the path before the image id           |
| `IMAGE_QUALITY`       | between 50..100, 80 is the recommended quality                        |
| `CACHE_CONTROL`       | the Cache-Control header to set for processed images                  |
| `SECURITY_TOKEN`      | configured in Cloudfront to prevent access without Cloudfront         |
| `AWS_*`               | configure AWS SDK, e.g. credentials or region, local development only |

## Tools

- [sharp](https://github.com/lovell/sharp) high performance image processing
- [ts-node](https://github.com/TypeStrong/ts-node) and [ts-node-dev](https://github.com/wclr/ts-node-dev) for running lambda locally
- [esbuild](https://esbuild.github.io/) super fast Typescript transpiler and bundler
- [Jest](https://jestjs.io/) for testing
- [Babel](https://babeljs.io/) as a Jest transformer
- [Prettier](https://prettier.io/) for code formatting
- [Husky](https://github.com/typicode/husky) for managing git hooks, e.g. run tests before committing
- [@atombrenner/cfn-stack](https://github.com/atombrenner/cfn-stack) execute Cloudformation stacks with Typescript
