import { useState, useCallback } from 'react'

const STORAGE_KEY = 'quiz_word_config'

// Structure : { "10e": { "Maths": "10e_maths.docx", ... }, ... }
function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function useWordConfig() {
  const [wordConfig, setWordConfig] = useState(() => loadConfig())

  const setWordFile = useCallback((level, subject, filename) => {
    setWordConfig(prev => {
      const updated = {
        ...prev,
        [level]: {
          ...(prev[level] || {}),
          [subject]: filename.trim(),
        },
      }
      saveConfig(updated)
      return updated
    })
  }, [])

  const removeWordFile = useCallback((level, subject) => {
    setWordConfig(prev => {
      const updated = { ...prev }
      if (updated[level]) {
        delete updated[level][subject]
        if (Object.keys(updated[level]).length === 0) delete updated[level]
      }
      saveConfig(updated)
      return updated
    })
  }, [])

  const getWordFile = useCallback((level, subject) => {
    return wordConfig[level]?.[subject] || null
  }, [wordConfig])

  return { wordConfig, setWordFile, removeWordFile, getWordFile }
}
