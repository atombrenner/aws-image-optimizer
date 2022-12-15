import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const ssm = new SSMClient({})

async function getParameterValue(name: string) {
  const command = new GetParameterCommand({ Name: name, WithDecryption: true })
  const output = await ssm.send(command)
  const value = output.Parameter?.Value
  if (typeof value === 'undefined') {
    throw Error(`parameter ${name} is undefined`)
  }
  return value
}

// get decrypted secret parameters from AWS Systems Manager Parameter Store
export async function getSecrets<T extends Record<string, string>>(propToParam: T): Promise<T> {
  const entryPromises = Object.entries(propToParam).map(async ([propertyName, parameterName]) => {
    const value = await getParameterValue(parameterName)
    return [propertyName, value]
  })
  return Object.fromEntries(await Promise.all(entryPromises)) as T
}
