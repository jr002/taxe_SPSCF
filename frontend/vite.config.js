import { readFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const unitefiscalPath = fileURLToPath(new URL('../unitefiscal.json', import.meta.url))

function unitefiscalJsonPlugin() {
  return {
    name: 'unitefiscal-json',
    configureServer(server) {
      server.middlewares.use('/unitefiscal.json', async (_request, response, next) => {
        try {
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(await readFile(unitefiscalPath))
        } catch (error) {
          next(error)
        }
      })
    },
    async generateBundle() {
      const source = await readFile(unitefiscalPath, 'utf8')
      this.emitFile({
        type: 'asset',
        fileName: 'unitefiscal.json',
        source,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), unitefiscalJsonPlugin()],
  resolve: {
    // `@/…` désigne src/ : un fichier peut changer de dossier sans que ses
    // importateurs aient à recalculer leur profondeur relative.
    alias: [
      {
        find: /^@\//,
        replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/`,
      },
    ],
  },
  server: {
    // Double pile IPv4/IPv6 : lié à `localhost`, Vite n'écoute que sur [::1] et
    // Chrome, qui ouvre parfois ses sockets vers 127.0.0.1, essuie des
    // ERR_CONNECTION_REFUSED sporadiques (modules lazy et /api). Écouter sur ::
    // accepte les deux familles et supprime ces refus.
    host: '::',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
