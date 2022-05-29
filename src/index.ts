import type { Plugin } from 'vite'
import type { AddressInfo } from 'net'
import net from 'net'
import os from 'os'

const MIN_PORT = 1024
const MAX_PORT = 65_535
const VITE_PLUGIN_NAME = 'vite-plugin-port'

function getLocalHosts(): Set<string | undefined> {
    const interfaces = os.networkInterfaces()
    const results = new Set([undefined, '0.0.0.0'])
    for (const _interface of Object.values(interfaces)) {
        if (_interface) {
            for (const config of _interface) {
                results.add(config.address)
            }
        }
    }
    return results
}

function checkAvailablePort(basePort: number, host: string | undefined): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer()
        server.unref()
        server.on('error', reject)
        server.listen(basePort, host, () => {
            const { port } = server.address() as AddressInfo
            server.close(() => {
                resolve(port)
            })
        })
    })
}

async function getAvailablePort(port: number, hosts: Set<string | undefined>) {
    const interfaceErrors = new Set(['EADDRNOTAVAIL', 'EINVAL'])
    for (const host of hosts) {
        try {
            // eslint-disable-next-line no-await-in-loop
            await checkAvailablePort(port, host)
        } catch (error: any) {
            if (
                !interfaceErrors.has(error.code)
            ) {
                throw error
            }
        }
    }

    return port
}

async function getPorts(basePort: number, host: string) {
    if (basePort < MIN_PORT || basePort > MAX_PORT) {
        throw new Error(`Port number must lie between ${MIN_PORT} and ${MAX_PORT}`)
    }

    let hosts
    let port = basePort
    const localhosts = getLocalHosts()
    if (host && !localhosts.has(host)) {
        hosts = new Set([host])
    } else {
        hosts = localhosts
    }
    const portUnavailableErrors = new Set(['EADDRINUSE', 'EACCES'])
    while (port <= MAX_PORT) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const availablePort = await getAvailablePort(port, hosts)
            return availablePort
        } catch (error: any) {
            if (
                !portUnavailableErrors.has(error.code)
            ) {
                throw error
            }
            port += 1
        }
    }

    throw new Error('No available ports found')
}

function PluginPort(): Plugin {
    return {
        name: VITE_PLUGIN_NAME,
        enforce: 'pre',
        apply: 'serve',
        async config(config) {
            const { server } = config
            let host = ''
            const port = server?.port || 3000
            if (server?.host === true) {
                host = '0.0.0.0'
            }
            if (server?.host !== true && server?.host) {
                host = server?.host
            }
            if (!server?.host) {
                host = ''
            }
            const _port = await getPorts(port || 3000, host)
            return {
                server: {
                    port: _port,
                    strictPort: false
                }
            }
        }
    }
}

export default PluginPort
