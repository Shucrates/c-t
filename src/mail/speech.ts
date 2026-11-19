import { useCallback, useEffect, useRef, useState } from 'react'
import { languages, type LangCode } from '../i18n'

const speechLang = (code: LangCode) => (languages.find((l) => l.code === code) ?? languages[0]).speech

// Natural voice from the local /api/tts endpoint (Gemini), cached per text and speed
const aiAudio = new Map<string, string>()
async function fetchVoice(text: string, slow: boolean, signal: AbortSignal) {
  const key = `${slow ? 1 : 0}|${text}`
  const hit = aiAudio.get(key)
  if (hit) return hit
  const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, slow }), signal })
  if (!r.ok) throw new Error(`tts ${r.status}`)
  const url = URL.createObjectURL(await r.blob())
  aiAudio.set(key, url)
  return url
}

// Read text aloud in the chosen language, at a calm pace that can be slowed further.
// Tries the natural AI voice first; if there is no key, no network or the language is the
// made-up Galactic script, it uses the device's own voice instead.
export function useSpeech(langCode: LangCode) {
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slow, setSlow] = useState(false)
  const last = useRef('')
  const audio = useRef<HTMLAudioElement | null>(null)
  const pending = useRef<AbortController | null>(null)
  const hasDevice = typeof window !== 'undefined' && 'speechSynthesis' in window
  const supported = true

  const halt = useCallback(() => {
    pending.current?.abort()
    pending.current = null
    audio.current?.pause()
    audio.current = null
    if (hasDevice) window.speechSynthesis.cancel()
  }, [hasDevice])

  const stop = useCallback(() => {
    halt()
    setLoading(false)
    setSpeaking(false)
  }, [halt])

  const deviceSpeak = useCallback(
    (text: string, slower: boolean) => {
      if (!hasDevice) return setSpeaking(false)
      const synth = window.speechSynthesis
      const lang = speechLang(langCode)
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))
      if (voice) u.voice = voice
      u.rate = slower ? 0.7 : 0.9
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      synth.speak(u)
    },
    [langCode, hasDevice],
  )

  const speak = useCallback(
    async (text: string, slower = slow) => {
      if (!text.trim()) return
      halt()
      last.current = text
      setSpeaking(true)
      if (langCode === 'sga') return deviceSpeak(text, slower)
      const ctrl = new AbortController()
      pending.current = ctrl
      setLoading(true)
      try {
        const url = await fetchVoice(text, slower, ctrl.signal)
        if (ctrl.signal.aborted) return
        const a = new Audio(url)
        audio.current = a
        a.onended = () => setSpeaking(false)
        a.onerror = () => setSpeaking(false)
        setLoading(false)
        await a.play()
      } catch {
        if (ctrl.signal.aborted) return
        setLoading(false)
        deviceSpeak(text, slower)
      } finally {
        if (pending.current === ctrl) pending.current = null
      }
    },
    [langCode, slow, halt, deviceSpeak],
  )

  // Restart the current text at the other speed
  const toggleSlow = useCallback(() => {
    const next = !slow
    setSlow(next)
    if (speaking) speak(last.current, next)
  }, [slow, speaking, speak])

  useEffect(() => () => halt(), [halt])

  return { speaking, loading, speak, stop, supported, slow, toggleSlow }
}

type Recognition = {
  lang: string
  interimResults: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

// Tap-to-talk dictation where the browser offers it (Chrome, Safari); otherwise `supported` is false
export function useListen(langCode: LangCode) {
  const [listening, setListening] = useState(false)
  const rec = useRef<Recognition | null>(null)
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  const supported = !!Ctor

  const stop = useCallback(() => {
    rec.current?.stop()
    setListening(false)
  }, [])

  const listen = useCallback(
    (onText: (text: string) => void) => {
      if (!Ctor) return
      rec.current?.stop()
      const r = new Ctor()
      r.lang = speechLang(langCode)
      r.interimResults = false
      r.onresult = (e) => onText(e.results[0][0].transcript)
      r.onend = () => setListening(false)
      r.onerror = () => setListening(false)
      rec.current = r
      setListening(true)
      r.start()
    },
    [Ctor, langCode],
  )

  useEffect(() => () => rec.current?.stop(), [])
  return { listening, listen, stop, supported }
}
