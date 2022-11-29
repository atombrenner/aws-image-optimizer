# AWS Web Image Optimizer

Converts and crops large images to web-optimized formats like webp or avif in one step to reduce image size.
Works well with [focus point cropping](https://github.com/atombrenner/focus-crop-react)

## Prerequisites

- run `npm ci`

## Commands

- `npm test` executes test with jest
- `npm run build` creates ./dist/lambda.js bundle
- `npm run zip` creates the ./dist/lambda.zip from ./dist/lambda.js and ./dist/lambda.js.map
- `npm run dist` runs all of the above steps
- `npm run stack` creates or updates the CloudFormation stack
- `npm run deploy` used to deploy ./dist/lambda.zip to the created lambda function
- `npm start` will start the lambda function locally

## Tools

- [sharp](https://github.com/lovell/sharp) high performance image processing
- [esbuild](https://esbuild.github.io/) super fast Typescript transpiler and bundler
- [Jest](https://jestjs.io/) for testing
- [Babel](https://babeljs.io/) as a Jest transformer
- [Prettier](https://prettier.io/) for code formatting
- [Husky](https://github.com/typicode/husky) for managing git hooks, e.g. run tests before committing
- [@atombrenner/cfn-stack](https://github.com/atombrenner/cfn-stack) execute Cloudformation stacks with Typescript
