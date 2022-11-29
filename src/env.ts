export const env =
  process.env.NODE_ENV === 'test'
    ? () => 'test'
    : (name: string): string => {
        const value = process.env[name]
        if (!value) throw Error(`Environment variable ${name} is not defined or empty`)
        return value
      }
