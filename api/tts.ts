import type { IncomingMessage, ServerResponse } from 'node:http'

// Read-aloud voice through the Gemini API, used in two places:
//  - on Vercel, this file is a serverless function served at /api/tts
//  - locally, tts-plugin.ts mounts the same handler on the Vite dev server
// The key comes from GEMINI_API_KEY (Vercel env settings, or .env.local) and never reaches the browser.
// Without a key it answers 503 and the app falls back to the device's own voice.

const MODEL = 'gemini-3.8-flash-lite-tts'
const VOICE = 'Sulafat' // listed as "Warm"
const STYLE = 'calm, warm and reassuring, clear and unhurried'
const STYLE_SLOW = 'calm, warm and reassuring, speaking slowly'

/* ------------------------------------------------------------ Guards
 * 1. Same site only: the request must come from a page on this site.
 * 2. JSON only: a cross-site form or script can't send it without a CORS preflight, which we never allow.
 * 3. Text length cap, so one request can't cost much.
 * 4. A per-visitor rate limit (best effort: each serverless instance keeps its own count).
 */
const MAX_CHARS = 4000
const RATE_LIMIT = 30 // requests
const RATE_WINDOW_MS = 60_000 // per minute, per visitor

const hits = new Map<string, number[]>()
function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > RATE_LIMIT
}

const header = (req: IncomingMessage, name: string) => {
  const v = req.headers[name]
  return Array.isArray(v) ? v[0] : v
}

function sameSite(req: IncomingMessage) {
  const host = header(req, 'x-forwarded-host') ?? header(req, 'host')
  const from = header(req, 'origin') ?? header(req, 'referer')
  if (!host || !from) return false
  try {
    const fromHost = new URL(from).host
    // Extra allowed sites, comma separated (for example a custom domain), from ALLOWED_ORIGINS
    const extra = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    return fromHost === host || extra.some((o) => o === from || o === fromHost)
  } catch {
    return false
  }
}

/* ------------------------------------------------------------ Gemini */

// Raw 16-bit mono PCM needs a RIFF header before a browser can play it
function wavFromPcm(pcm: Buffer, rate = 24000) {
  const h = Buffer.alloc(44)
  h.write('RIFF', 0)
  h.writeUInt32LE(36 + pcm.length, 4)
  h.write('WAVE', 8)
  h.write('fmt ', 12)
  h.writeUInt32LE(16, 16)
  h.writeUInt16LE(1, 20)
  h.writeUInt16LE(1, 22)
  h.writeUInt32LE(rate, 24)
  h.writeUInt32LE(rate * 2, 28)
  h.writeUInt16LE(2, 32)
  h.writeUInt16LE(16, 34)
  h.write('data', 36)
  h.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([h, pcm])
}

async function synthesize(key: string, text: string, slow: boolean) {
  const call = (voiceConfig: object) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text, speech_metadata: { style: slow ? STYLE_SLOW : STYLE } }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig } },
      }),
    })
  // Current docs name the field `voice`; older API versions used prebuiltVoiceConfig.voiceName
  let r = await call({ voice: VOICE })
  if (r.status === 400) r = await call({ prebuiltVoiceConfig: { voiceName: VOICE } })
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`)
  const json = (await r.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[] }
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData
  if (!part?.data) throw new Error('Gemini returned no audio')
  const bytes = Buffer.from(part.data, 'base64')
  const rate = Number(/rate=(\d+)/.exec(part.mimeType ?? '')?.[1]) || 24000
  return bytes.subarray(0, 4).toString() === 'RIFF' ? bytes : wavFromPcm(bytes, rate)
}

/* ------------------------------------------------------------ Handler */

async function readJson(req: IncomingMessage): Promise<{ text?: string; slow?: boolean }> {
  // Vercel may have parsed the body already
  const parsed = (req as IncomingMessage & { body?: unknown }).body
  if (parsed && typeof parsed === 'object') return parsed as { text?: string; slow?: boolean }
  if (typeof parsed === 'string') return JSON.parse(parsed)
  let data = ''
  for await (const chunk of req) {
    data += chunk
    if (data.length > 64_000) throw new Error('too large')
  }
  return JSON.parse(data)
}

function send(res: ServerResponse, status: number, body: string) {
  res.statusCode = status
  res.setHeader('Content-Type', 'text/plain')
  res.end(body)
}

export async function handleTts(req: IncomingMessage, res: ServerResponse, key = process.env.GEMINI_API_KEY) {
  if (req.method !== 'POST') return send(res, 405, 'POST only')
  if (!(header(req, 'content-type') ?? '').includes('application/json')) return send(res, 415, 'JSON only')
  if (!sameSite(req)) return send(res, 403, 'Not allowed from this site')
  const ip = (header(req, 'x-forwarded-for') ?? req.socket.remoteAddress ?? 'unknown').split(',')[0].trim()
  if (rateLimited(ip)) return send(res, 429, 'Too many requests, try again in a minute')
  if (!key) return send(res, 503, 'No GEMINI_API_KEY set')
  try {
    const { text, slow } = await readJson(req)
    if (typeof text !== 'string' || !text.trim()) return send(res, 400, 'No text')
    if (text.length > MAX_CHARS) return send(res, 413, 'Text too long')
    const wav = await synthesize(key, text, !!slow)
    res.statusCode = 200
    res.setHeader('Content-Type', 'audio/wav')
    res.setHeader('Cache-Control', 'no-store')
    res.end(wav)
  } catch (e) {
    console.error('[tts]', (e as Error).message)
    send(res, 502, 'Speech failed')
  }
}

// Vercel serverless entry point
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleTts(req, res)
}
