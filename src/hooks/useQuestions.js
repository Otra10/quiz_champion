import { useState, useCallback } from 'react'
import defaultQuestions from '../data/questions.json'

const STORAGE_KEY = 'quiz_custom_questions'

function loadCustomQuestions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveCustomQuestions(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useQuestions() {
  const [customQuestions, setCustomQuestions] = useState(() => loadCustomQuestions())

  const getQuestions = useCallback((level, subject) => {
    return (
      customQuestions[level]?.[subject] ||
      defaultQuestions[level]?.[subject] ||
      []
    )
  }, [customQuestions])

  const getCustomQuestions = useCallback((level, subject) => {
    return customQuestions[level]?.[subject] || []
  }, [customQuestions])

  const addQuestion = useCallback((level, subject, question) => {
    setCustomQuestions(prev => {
      const levelData = prev[level] || {}
      const subjectData = levelData[subject] || []
      const updated = {
        ...prev,
        [level]: { ...levelData, [subject]: [...subjectData, question] },
      }
      saveCustomQuestions(updated)
      return updated
    })
  }, [])

  const updateQuestion = useCallback((level, subject, index, question) => {
    setCustomQuestions(prev => {
      const subjectData = [...(prev[level]?.[subject] || [])]
      subjectData[index] = question
      const updated = {
        ...prev,
        [level]: { ...(prev[level] || {}), [subject]: subjectData },
      }
      saveCustomQuestions(updated)
      return updated
    })
  }, [])

  const deleteQuestion = useCallback((level, subject, index) => {
    setCustomQuestions(prev => {
      const subjectData = (prev[level]?.[subject] || []).filter((_, i) => i !== index)
      const updated = {
        ...prev,
        [level]: { ...(prev[level] || {}), [subject]: subjectData },
      }
      saveCustomQuestions(updated)
      return updated
    })
  }, [])

  const resetToDefault = useCallback((level, subject) => {
    setCustomQuestions(prev => {
      const updated = { ...prev }
      if (updated[level]) {
        delete updated[level][subject]
        if (Object.keys(updated[level]).length === 0) delete updated[level]
      }
      saveCustomQuestions(updated)
      return updated
    })
  }, [])

  const hasCustom = useCallback((level, subject) => {
    return (customQuestions[level]?.[subject]?.length || 0) > 0
  }, [customQuestions])

  // ✅ NOUVEAU : importe les questions Word dans le localStorage
  // mode 'replace' → écrase les questions existantes pour ce niveau/matière
  // mode 'merge'   → ajoute en évitant les doublons (comparaison sur le texte)
  const importQuestions = useCallback((level, subject, questions, mode = 'replace') => {
    setCustomQuestions(prev => {
      let finalQuestions
      if (mode === 'merge') {
        const existing = prev[level]?.[subject] || []
        const existingTexts = new Set(existing.map(q => q.question))
        const newOnes = questions.filter(q => !existingTexts.has(q.question))
        finalQuestions = [...existing, ...newOnes]
      } else {
        // 'replace' : on part des questions du JSON de base si aucune custom,
        // mais on écrase complètement avec celles du Word
        finalQuestions = questions
      }
      const updated = {
        ...prev,
        [level]: { ...(prev[level] || {}), [subject]: finalQuestions },
      }
      saveCustomQuestions(updated)
      return updated
    })
  }, [])

  return {
    getQuestions,
    getCustomQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    resetToDefault,
    hasCustom,
    importQuestions, // ✅ à passer à AdminPanel
    customQuestions,
  }
}