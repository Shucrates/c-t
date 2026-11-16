import { useCallback, useEffect, useRef, useState } from 'react'
import { languages, type LangCode } from '../i18n'

const speechLang = (code: LangCode) => (languages.find((l) => l.code === code) ?? languages[0]).speech

// Read text aloud in the chosen language, at a calm pace that can be slowed further
export function useSpeech(langCode: LangCode) {
  const [speaking, setSpeaking] = useState(false)
  const [slow, setSlow] = useState(false)
  const last = useRef('')
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string, slower = slow) => {
      if (!supported || !text.trim()) return
      const synth = window.speechSynthesis
      synth.cancel()
      last.current = text
      const lang = speechLang(langCode)
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))
      if (voice) u.voice = voice
      u.rate = slower ? 0.7 : 0.9
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      setSpeaking(true)
      synth.speak(u)
    },
    [langCode, supported, slow],
  )

  // Restart the current text at the other speed
  const toggleSlow = useCallback(() => {
    const next = !slow
    setSlow(next)
    if (speaking) speak(last.current, next)
  }, [slow, speaking, speak])

  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel()
  }, [supported])

  return { speaking, speak, stop, supported, slow, toggleSlow }
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
