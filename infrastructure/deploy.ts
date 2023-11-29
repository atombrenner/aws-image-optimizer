import { LambdaClient, UpdateFunctionCodeCommand } from '@aws-sdk/client-lambda'
import { readFileSync } from 'fs'

async function main() {
  const lambda = new LambdaClient({})

  const buffer = readFileSync('./dist/lambda.zip')

  const command = new UpdateFunctionCodeCommand({
    FunctionName: 'web-image-optimizer',
    ZipFile: buffer,
  })
  const result = await lambda.send(command)

  console.log(`deployed ${result.FunctionName} lambda function`)
}

main().catch((err) => {
  console.error(err.name ?? '', err.message)
  process.exit(1) // exit the process with an error code
})
