# vite-plugin-port

Solve the port duplication when Vite starts the service when the `host` option is turned on

## Install
```bash
npm i vite-plugin-port -D
```

## Usage
```typescript
import PortPlugin from 'vite-plugin-port'

{
    plugins:[
        PortPlugin()
    ]
}
```
