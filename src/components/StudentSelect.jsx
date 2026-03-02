import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudents } from '../hooks/useStudents'

export default function StudentSelect({ onStudentReady, onBack, onEndContest, players }) {
  const { students, addStudent } = useStudents()
  const [newName, setNewName] = useState('')
  const [nameError, setNameError] = useState('')
  const [selected, setSelected] = useState(null)

  const handleAddAndSelect = (e) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    addStudent(trimmed)
    setSelected(trimmed)
    setNewName('')
    setNameError('')
  }

  const handleConfirm = () => {
    if (!selected) return
    onStudentReady(selected)
  }

  // Élèves qui ont déjà joué dans cette session
  const playedNames = new Set(players.map(p => p.name))

  return (
    <motion.div
      className="student-select-screen"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
    >
      <div className="student-select-header">
        <button className="btn-back" onClick={onBack}>← Retour</button>
        <h2 className="student-select-title">👤 Qui va jouer ?</h2>
        {players.length > 0 && (
          <button className="btn-podium-preview" onClick={onEndContest}>
            🏆 Voir le podium
          </button>
        )}
      </div>

      <div className="student-select-body">
        {/* Saisie d'un nouveau nom */}
        <div className="student-new-section">
          <h3>Nouveau nom ou nom libre</h3>
          <form className="add-student-form" onSubmit={handleAddAndSelect}>
            <input
              type="text"
              className="name-input"
              placeholder="Entrer le nom de l'élève..."
              value={newName}
              onChange={e => { setNewName(e.target.value); setNameError('') }}
              maxLength={40}
              autoFocus
            />
            <motion.button
              type="submit"
              className="btn-confirm-name"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={!newName.trim()}
            >
              + Sélectionner
            </motion.button>
          </form>
          {nameError && <p className="form-error">{nameError}</p>}
        </div>

        {/* Liste des élèves enregistrés */}
        {students.length > 0 && (
          <div className="student-existing-section">
            <h3>Élèves enregistrés</h3>
            <div className="student-grid">
              <AnimatePresence>
                {students.map((s, i) => {
                  const hasPlayed = playedNames.has(s.name)
                  return (
                    <motion.button
                      key={s.name}
                      className={`student-card ${selected === s.name ? 'selected' : ''} ${hasPlayed ? 'played' : ''}`}
                      onClick={() => setSelected(s.name)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="student-card-icon">
                        {selected === s.name ? '✓' : hasPlayed ? '✅' : '👤'}
                      </span>
                      <span className="student-card-name">{s.name}</span>
                      {hasPlayed && (
                        <span className="played-badge">
                          {players.find(p => p.name === s.name)?.score ?? 0} pts
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Bouton de confirmation */}
        <AnimatePresence>
          {selected && (
            <motion.div
              className="student-confirm-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="student-selected-label">
                Élève sélectionné : <strong>{selected}</strong>
              </p>
              <motion.button
                className="btn-start-quiz"
                onClick={handleConfirm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                🎯 Commencer le quiz →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
