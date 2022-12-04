import { Stack } from '@atombrenner/cfn-stack'
import * as fs from 'fs'

async function main() {
  const template = fs.readFileSync(`${__dirname}/cloudformation.yaml`, { encoding: 'utf-8' })
  const stack = new Stack({ name: 'web-image-optimizer' })

  // set params, e.g. security-token
  const params = { SecurityToken: 'secret' } // read secrets from ssm e.g.

  // create or update stack, print events and wait for completion
  await stack.createOrUpdate(template, params)

  // access stack outputs
  const outputs: Record<string, string> = await stack.getOutputs()
  console.dir(outputs)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1) // exit the process with an error code
})
