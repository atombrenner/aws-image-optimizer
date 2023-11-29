import { Stack } from '@atombrenner/cfn-stack'
import { readFileSync } from 'fs'
import { minify } from 'terser'
import { getSecrets } from './ssm'

async function main() {
  const template = readFileSync(`${__dirname}/cloudformation.yaml`, 'utf-8')
  const stack = new Stack({ name: 'web-image-optimizer' })

  // get secrets from AWS Systems Manager Parameter Store
  const { UrlSigningSecret, ...secretParams } = await getSecrets({
    SecurityToken: 'image-optimizer-security-token',
    UrlSigningSecret: 'image-optimizer-url-signing-secret',
  })

  const params = {
    ViewerRequestFunction: await loadCloudFrontFunction('viewerRequest.js', { UrlSigningSecret }),
  }

  // create or update stack, print events and wait for completion
  await stack.createOrUpdate(template, { ...params, ...secretParams })

  // access stack outputs
  const outputs = await stack.getOutputs()
  console.dir(outputs)
}

const loadCloudFrontFunction = async (name: string, params: Record<string, string>) => {
  const js = readFileSync(`${__dirname}/cloudFrontFunctions/${name}`, 'utf-8')
  const { code } = await minify(js)
  if (!code) throw Error('terser did not return minified code')

  // replace variables in function code
  return Object.entries(params).reduce(
    (code, [name, value]) => code.replaceAll(`{{${name}}}`, value),
    code
  )
}

main().catch((err) => {
  console.error(err.name ?? '', err.message)
  process.exit(1) // exit the process with an error code
})
