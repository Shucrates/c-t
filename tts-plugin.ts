import type { Plugin } from 'vite'
import { handleTts } from './api/tts'

// Mounts the same /api/tts handler Vercel runs (api/tts.ts) on the local dev and preview servers,
// with the key read from .env.local.
export function geminiTts(key: string | undefined): Plugin {
  const mount = (server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) =>
    server.middlewares.use((req, res, next) => (req.url === '/api/tts' ? void handleTts(req, res, key) : next()))
  return {
    name: 'gemini-tts',
    configureServer: mount,
    configurePreviewServer: mount,
  }
}
