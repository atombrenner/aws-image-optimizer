import { signedUrlPath } from '../lib/urlSignature'
import { getSecrets } from './ssm'

const getUrlSigningSecret = async () => {
  const { UrlSigningSecret } = await getSecrets({
    UrlSigningSecret: 'image-optimizer-url-signing-secret',
  })
  return UrlSigningSecret
}

async function main() {
  const path = process.argv[2]
  const secret = process.argv[3] || (await getUrlSigningSecret())

  if (!path) throw Error('missing path argument')
  if (!secret) throw Error('missing secret argument')

  console.log(signedUrlPath(path, secret))
}
main().catch(console.error)

//  AWS_REGION=eu-west-1 AWS_PROFILE=atombrenner npx ts-node -T infrastructure/signUrl.ts <path> [secret]
