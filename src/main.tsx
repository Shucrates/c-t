import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App, { type Prefs } from './App'
import { Onboarding } from './Onboarding'
import type { LangCode } from './i18n'
import './index.css'
import './theme-muted.css'

// Muted colours by default; ?theme=mono shows the original black-and-white version
if (new URLSearchParams(location.search).get('theme') !== 'mono') document.documentElement.dataset.theme = 'muted'

const ONBOARDED_KEY = 'cat-onboarded'
const PREFS_KEY = 'cat-prefs'

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked (private mode): settings simply reset next time
  }
}

const DEFAULTS: Prefs = { lang: 'en', sizeIndex: 0, highContrast: false, name: '', trustedName: '', trustedPhone: '' }

function Root() {
  const [prefs, setPrefs] = useState<Prefs>(() => {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') }
    } catch {
      return DEFAULTS
    }
  })
  const [lang, setLang] = useState<LangCode>(prefs.lang)
  const [onboarded, setOnboarded] = useState(() => {
    // Add ?onboarding to the URL to see it again
    if (new URLSearchParams(location.search).has('onboarding')) return false
    try {
      return localStorage.getItem(ONBOARDED_KEY) === '1'
    } catch {
      return false
    }
  })

  const save = (p: Partial<Prefs>) =>
    setPrefs((old) => {
      const next = { ...old, ...p }
      store(PREFS_KEY, JSON.stringify(next))
      return next
    })

  if (!onboarded) {
    return (
      <Onboarding
        lang={lang}
        onLangChange={setLang}
        onDone={(result) => {
          save({ ...result, lang })
          store(ONBOARDED_KEY, '1')
          setOnboarded(true)
        }}
      />
    )
  }
  return (
    <App
      prefs={prefs}
      onPrefsChange={save}
      onReplayIntro={() => {
        setLang(prefs.lang)
        document.documentElement.style.fontSize = ''
        setOnboarded(false)
      }}
    />
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
