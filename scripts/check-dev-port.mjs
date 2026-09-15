import { createServer } from 'node:net'
import { resolveConfig } from 'vite'

const config = await resolveConfig({ configFile: 'vite.vue.config.js' }, 'serve')
const port = config.server.port || 5173
const host = typeof config.server.host === 'string' ? config.server.host : 'localhost'
const server = createServer()

server.once('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is in use. Stop the existing preview before starting this project again.`
    : `Cannot check port ${port}: ${error.message}`)
  process.exitCode = 1
})

server.listen(port, host, () => {
  console.log(`Port ${port} is available.`)
  server.close()
})
