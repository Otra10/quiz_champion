import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuestions } from '../hooks/useQuestions'
import defaultQuestions from '../data/questions.json'

const LEVELS = ['10e', 'TSECO', 'TSE', 'TSEXp', '11SES', '11SC']
const SUBJECTS = ['Maths', 'Physique', 'Chimie', 'SVT', 'Histoire-Géographie', 'Économie']
const OPTION_LETTERS = ['A', 'B', 'C', 'D']

const emptyForm = () => ({
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
})

export default function QuestionEditor() {
  const { getQuestions, getCustomQuestions, addQuestion, updateQuestion, deleteQuestion, resetToDefault, hasCustom } = useQuestions()

  const [level, setLevel] = useState(LEVELS[0])
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [form, setForm] = useState(emptyForm())
  const [editingIndex, setEditingIndex] = useState(null)
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const questions = getQuestions(level, subject)
  const customCount = getCustomQuestions(level, subject).length
  const defaultCount = defaultQuestions[level]?.[subject]?.length || 0
  const isCustom = hasCustom(level, subject)

  const handleOptionChange = (i, val) => {
    setForm(f => {
      const options = [...f.options]
      options[i] = val
      return { ...f, options }
    })
  }

  const validateForm = () => {
    if (!form.question.trim()) return 'La question est obligatoire.'
    for (let i = 0; i < 4; i++) {
      if (!form.options[i].trim()) return `L'option ${OPTION_LETTERS[i]} est obligatoire.`
    }
    return ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = validateForm()
    if (err) { setFormError(err); return }
    setFormError('')

    const q = {
      question: form.question.trim(),
      options: form.options.map(o => o.trim()),
      correctIndex: form.correctIndex,
    }

    if (editingIndex !== null) {
      updateQuestion(level, subject, editingIndex, q)
      setEditingIndex(null)
    } else {
      addQuestion(level, subject, q)
    }

    setForm(emptyForm())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleEdit = (index) => {
    const q = questions[index]
    setForm({ question: q.question, options: [...q.options], correctIndex: q.correctIndex })
    setEditingIndex(index)
    setFormError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setForm(emptyForm())
    setEditingIndex(null)
    setFormError('')
  }

  const handleDelete = (index) => {
    deleteQuestion(level, subject, index)
    if (editingIndex === index) handleCancelEdit()
    setDeleteConfirm(null)
  }

  const handleReset = () => {
    resetToDefault(level, subject)
    setConfirmReset(false)
    handleCancelEdit()
  }

  return (
    <div className="qe-container">
      {/* Sélecteurs niveau / matière */}
      <div className="qe-selectors">
        <div className="selector-group">
          <label>Niveau</label>
          <select className="admin-select" value={level} onChange={e => { setLevel(e.target.value); handleCancelEdit() }}>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="selector-group">
          <label>Matière</label>
          <select className="admin-select" value={subject} onChange={e => { setSubject(e.target.value); handleCancelEdit() }}>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="qe-stats">
          <span className="qe-stat-badge">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </span>
          {isCustom && (
            <span className="qe-stat-badge custom">
              {customCount} personnalisée{customCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="qe-layout">
        {/* ===== FORMULAIRE ===== */}
        <div className="qe-form-panel">
          <h3 className="qe-panel-title">
            {editingIndex !== null ? `✏️ Modifier la question ${editingIndex + 1}` : '➕ Nouvelle question'}
          </h3>

          <form className="qe-form" onSubmit={handleSubmit}>
            {/* Texte de la question */}
            <div className="qe-field">
              <label className="qe-label">Question</label>
              <textarea
                className="qe-textarea"
                placeholder="Écris ta question ici..."
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Options A B C D */}
            <div className="qe-options-section">
              <label className="qe-label">Options de réponse</label>
              <div className="qe-options-grid">
                {form.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`qe-option-row ${form.correctIndex === i ? 'is-correct' : ''}`}
                  >
                    {/* Bouton radio pour choisir la bonne réponse */}
                    <button
                      type="button"
                      className={`qe-correct-btn ${form.correctIndex === i ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, correctIndex: i }))}
                      title={`Marquer ${OPTION_LETTERS[i]} comme bonne réponse`}
                    >
                      {form.correctIndex === i ? '✓' : OPTION_LETTERS[i]}
                    </button>
                    <input
                      type="text"
                      className="qe-option-input"
                      placeholder={`Option ${OPTION_LETTERS[i]}...`}
                      value={opt}
                      onChange={e => handleOptionChange(i, e.target.value)}
                      maxLength={120}
                    />
                    {form.correctIndex === i && (
                      <span className="qe-correct-label">✓ Bonne réponse</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="qe-hint">
                Clique sur la lettre à gauche pour marquer la bonne réponse.
                Actuellement : <strong style={{ color: 'var(--color-success-light)' }}>
                  {OPTION_LETTERS[form.correctIndex]}
                </strong>
              </p>
            </div>

            {/* Erreur */}
            {formError && (
              <motion.p
                className="form-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ⚠️ {formError}
              </motion.p>
            )}

            {/* Boutons */}
            <div className="qe-form-actions">
              <motion.button
                type="submit"
                className="btn-qe-save"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {editingIndex !== null ? '💾 Enregistrer les modifications' : '➕ Ajouter la question'}
              </motion.button>
              {editingIndex !== null && (
                <button type="button" className="btn-qe-cancel" onClick={handleCancelEdit}>
                  Annuler
                </button>
              )}
            </div>

            {/* Confirmation sauvegarde */}
            <AnimatePresence>
              {saved && (
                <motion.div
                  className="import-status success"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  ✅ Question enregistrée !
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* ===== LISTE DES QUESTIONS ===== */}
        <div className="qe-list-panel">
          <div className="qe-list-header">
            <h3 className="qe-panel-title">
              📋 Questions ({questions.length})
            </h3>
            {isCustom && (
              <button
                className="btn-qe-reset"
                onClick={() => setConfirmReset(true)}
                title="Revenir aux questions par défaut"
              >
                ↺ Réinitialiser
              </button>
            )}
          </div>

          {/* Confirmation reset */}
          <AnimatePresence>
            {confirmReset && (
              <motion.div
                className="qe-confirm-box"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p>Supprimer toutes les questions personnalisées pour <strong>{level} — {subject}</strong> ?</p>
                <div className="qe-confirm-actions">
                  <button className="btn-qe-danger" onClick={handleReset}>Oui, réinitialiser</button>
                  <button className="btn-qe-cancel" onClick={() => setConfirmReset(false)}>Annuler</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {questions.length === 0 ? (
            <p className="empty-list">Aucune question pour ce niveau/matière.</p>
          ) : (
            <div className="qe-questions-list">
              <AnimatePresence>
                {questions.map((q, index) => (
                  <motion.div
                    key={`${level}-${subject}-${index}`}
                    className={`qe-question-card ${editingIndex === index ? 'editing' : ''}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div className="qe-q-header">
                      <span className="qe-q-num">Q{index + 1}</span>
                      <p className="qe-q-text">{q.question}</p>
                      <div className="qe-q-actions">
                        <button
                          className="btn-qe-edit"
                          onClick={() => handleEdit(index)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        {deleteConfirm === index ? (
                          <>
                            <button className="btn-qe-danger-sm" onClick={() => handleDelete(index)}>✓</button>
                            <button className="btn-qe-cancel-sm" onClick={() => setDeleteConfirm(null)}>✗</button>
                          </>
                        ) : (
                          <button
                            className="btn-qe-delete"
                            onClick={() => setDeleteConfirm(index)}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="qe-q-options">
                      {q.options.map((opt, i) => (
                        <span
                          key={i}
                          className={`qe-q-option ${i === q.correctIndex ? 'correct' : ''}`}
                        >
                          <span className="qe-q-opt-letter">{OPTION_LETTERS[i]}</span>
                          {opt}
                          {i === q.correctIndex && <span className="qe-q-check">✓</span>}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
