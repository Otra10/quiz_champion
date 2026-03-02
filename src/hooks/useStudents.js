import { useState, useCallback } from 'react'

const STORAGE_KEY = 'quiz_students'

// Charge la liste depuis localStorage
function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Sauvegarde dans localStorage
function saveStudents(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function useStudents() {
  const [students, setStudents] = useState(() => loadStudents())

  const addStudent = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return false
    setStudents(prev => {
      // Pas de doublon (insensible à la casse)
      if (prev.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return prev
      const updated = [...prev, { name: trimmed, addedAt: Date.now() }]
      saveStudents(updated)
      return updated
    })
    return true
  }, [])

  const removeStudent = useCallback((name) => {
    setStudents(prev => {
      const updated = prev.filter(s => s.name !== name)
      saveStudents(updated)
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    setStudents([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { students, addStudent, removeStudent, clearAll }
}
