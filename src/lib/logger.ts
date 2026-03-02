import debug from 'debug'

export const createLogger = (namespace: string) => {
    return debug(`swiftclaw:${namespace}`)
}
