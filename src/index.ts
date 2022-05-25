import type { Plugin } from 'vite'

const VITE_PLUGIN_NAME = 'vite-plugin-port'

function PluginPort(): Plugin {
    return {
        name: VITE_PLUGIN_NAME
    }
}

export default PluginPort
