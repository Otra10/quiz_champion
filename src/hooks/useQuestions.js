import { useState, useCallback } from 'react'
import defaultQuestions from '../data/questions.json'

const STORAGE_KEY = 'quiz_custom_questions'

// Charge les questions personnalisées depuis localStorage
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

  // Retourne les questions actives : custom en priorité, sinon JSON par défaut
  const getQuestions = useCallback((level, subject) => {
    return (
      customQuestions[level]?.[subject] ||
      defaultQuestions[level]?.[subject] ||
      []
    )
  }, [customQuestions])

  // Retourne toutes les questions custom pour un niveau/matière
  const getCustomQuestions = useCallback((level, subject) => {
    return customQuestions[level]?.[subject] || []
  }, [customQuestions])

  // Ajoute une question à un niveau/matière
  const addQuestion = useCallback((level, subject, question) => {
    setCustomQuestions(prev => {
      const levelData = prev[level] || {}
      const subjectData = levelData[subject] || []
      const updated = {
        ...prev,
        [level]: {
          ...levelData,
          [subject]: [...subjectData, question],
        },
      }
      saveCustomQuestions(updated)
      return updated
    })
  }, [])

  // Modifie une question existante (par index)
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

  // Supprime une question par index
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

  // Réinitialise un niveau/matière aux questions par défaut
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

  // Indique si des questions custom existent pour ce niveau/matière
  const hasCustom = useCallback((level, subject) => {
    return (customQuestions[level]?.[subject]?.length || 0) > 0
  }, [customQuestions])

  return {
    getQuestions,
    getCustomQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    resetToDefault,
    hasCustom,
    customQuestions,
  }
}
