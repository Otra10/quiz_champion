import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStudents } from '../hooks/useStudents'
import { useWordConfig } from '../hooks/useWordConfig'
import { parseWordQuestions } from '../utils/wordParser'
import QuestionEditor from './QuestionEditor'
import defaultQuestions from '../data/questions.json'

const LEVELS = ['10e', 'TSECO', 'TSE', 'TSEXp', '11SES', '11SC']
const SUBJECTS = ['Maths', 'Physique', 'Chimie', 'SVT', 'Histoire-Géographie', 'Économie']

export default function AdminPanel({ onBack, onQuestionsImported }) {
  const [activeTab, setActiveTab] = useState('questions')
  const { students, addStudent, removeStudent, clearAll } = useStudents()
  const { wordConfig, setWordFile, removeWordFile } = useWordConfig()

  const [newName, setNewName] = useState('')
  const [nameError, setNameError] = useState('')
  const [selectedLevel, setSelectedLevel] = useState(LEVELS[0])
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0])
  const [wordFilename, setWordFilename] = useState('')
  const [importStatus, setImportStatus] = useState({})
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  // --- Gestion élèves ---
  const handleAddStudent = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    const added = addStudent(newName)
    if (!added) {
      setNameError(`"${newName.trim()}" existe déjà dans la liste.`)
    } else {
      setNewName('')
      setNameError('')
    }
  }

  // --- Télécharger le questions.json fusionné ---
  const handleDownloadJson = () => {
    // Récupère les questions custom du localStorage
    let custom = {}
    try {
      const raw = localStorage.getItem('quiz_custom_questions')
      custom = raw ? JSON.parse(raw) : {}
    } catch { custom = {} }

    // Fusionne : custom écrase les entrées du JSON de base
    const merged = { ...defaultQuestions }
    for (const level of Object.keys(custom)) {
      merged[level] = { ...(merged[level] || {}), ...custom[level] }
    }

    const blob = new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'questions.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Fonction commune d'import ---
  const handleQuestionsImported = (level, subject, filename, questions) => {
    const key = `${level}_${subject}`
    onQuestionsImported(level, subject, questions)
    setWordFile(level, subject, filename)
    setImportStatus(prev => ({
      ...prev,
      [key]: {
        type: 'success',
        msg: `✅ ${questions.length} question(s) importée(s) depuis "${filename}" et sauvegardées !`,
      },
    }))
  }

  // --- Import depuis /public/words/ ---
  const handleSaveWordPath = async () => {
    const filename = wordFilename.trim()
    if (!filename) return
    const key = `${selectedLevel}_${selectedSubject}`
    setImporting(true)
    setImportStatus(prev => ({ ...prev, [key]: { type: 'loading', msg: `Chargement de "${filename}"...` } }))
    try {
      const url = `/words/${filename}`
      const { parseWordQuestionsFromUrl } = await import('../utils/wordParser')
      const questions = await parseWordQuestionsFromUrl(url)
      if (questions.length === 0) {
        setImportStatus(prev => ({ ...prev, [key]: { type: 'error', msg: 'Aucune question trouvée. Vérifiez le format du fichier.' } }))
      } else {
        handleQuestionsImported(selectedLevel, selectedSubject, filename, questions)
        setWordFilename('')
      }
    } catch (err) {
      setImportStatus(prev => ({
        ...prev,
        [key]: { type: 'error', msg: `Erreur : fichier introuvable ou format invalide.` },
      }))
    } finally {
      setImporting(false)
    }
  }

  // --- Import direct depuis le navigateur ---
  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const key = `${selectedLevel}_${selectedSubject}`
    setImporting(true)
    setImportStatus(prev => ({ ...prev, [key]: { type: 'loading', msg: 'Lecture du fichier Word...' } }))
    try {
      const questions = await parseWordQuestions(file)
      if (questions.length === 0) {
        setImportStatus(prev => ({ ...prev, [key]: { type: 'error', msg: 'Aucune question trouvée. Vérifiez le format du fichier.' } }))
      } else {
        handleQuestionsImported(selectedLevel, selectedSubject, file.name, questions)
      }
    } catch (err) {
      setImportStatus(prev => ({ ...prev, [key]: { type: 'error', msg: `Erreur : ${err.message}` } }))
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const currentKey = `${selectedLevel}_${selectedSubject}`
  const currentWordFile = wordConfig[selectedLevel]?.[selectedSubject]
  const status = importStatus[currentKey]

  return (
    <motion.div
      className="admin-panel"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35 }}
    >
      {/* En-tête */}
      <div className="admin-header">
        <button className="btn-back" onClick={onBack}>← Retour</button>
        <h2 className="admin-title">⚙️ Panneau de gestion</h2>
      </div>

      {/* Onglets */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          ✏️ Questions
        </button>
        <button
          className={`admin-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👥 Élèves ({students.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'words' ? 'active' : ''}`}
          onClick={() => setActiveTab('words')}
        >
          📄 Import Word
        </button>
      </div>

      <div className="admin-content">
        <AnimatePresence mode="wait">

          {/* ===== ONGLET QUESTIONS ===== */}
          {activeTab === 'questions' && (
            <motion.div
              key="questions"
              className="tab-pane tab-pane-wide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <QuestionEditor />
            </motion.div>
          )}

          {/* ===== ONGLET ÉLÈVES ===== */}
          {activeTab === 'students' && (
            <motion.div
              key="students"
              className="tab-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="admin-hint">
                Les élèves ajoutés ici seront disponibles pour sélection au démarrage d'un quiz.
              </p>

              <form className="add-student-form" onSubmit={handleAddStudent}>
                <input
                  type="text"
                  className="name-input"
                  placeholder="Nom et prénom de l'élève..."
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
                  + Ajouter
                </motion.button>
              </form>
              {nameError && <p className="form-error">{nameError}</p>}

              {students.length === 0 ? (
                <p className="empty-list">Aucun élève enregistré.</p>
              ) : (
                <>
                  <div className="students-list">
                    <AnimatePresence>
                      {students.map((s, i) => (
                        <motion.div
                          key={s.name}
                          className="student-row"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <span className="student-index">{i + 1}.</span>
                          <span className="student-name-item">{s.name}</span>
                          <button
                            className="btn-remove"
                            onClick={() => removeStudent(s.name)}
                            title="Supprimer"
                          >✕</button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <button className="btn-clear-all" onClick={() => {
                    if (window.confirm('Supprimer tous les élèves ?')) clearAll()
                  }}>
                    🗑️ Vider la liste
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ===== ONGLET FICHIERS WORD ===== */}
          {activeTab === 'words' && (
            <motion.div
              key="words"
              className="tab-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="admin-hint">
                Sélectionne un niveau et une matière, puis importe le fichier Word.
                Les questions seront extraites et sauvegardées. Tu pourras ensuite
                télécharger le <code>questions.json</code> mis à jour pour remplacer celui de ton projet.
              </p>

              {/* Sélecteurs niveau / matière */}
              <div className="word-selectors">
                <div className="selector-group">
                  <label>Niveau</label>
                  <select
                    className="admin-select"
                    value={selectedLevel}
                    onChange={e => setSelectedLevel(e.target.value)}
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="selector-group">
                  <label>Matière</label>
                  <select
                    className="admin-select"
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Fichier actuel */}
              {currentWordFile && (
                <div className="word-current">
                  <span>📄 Fichier actuel :</span>
                  <code>{currentWordFile}</code>
                  <button
                    className="btn-remove"
                    onClick={() => removeWordFile(selectedLevel, selectedSubject)}
                    title="Supprimer"
                  >✕</button>
                </div>
              )}

              {/* Zone d'import */}
              <div className="word-import-zone">
                <h4>Importer un fichier Word</h4>
                <p className="admin-hint-small">
                  Clique sur le bouton pour sélectionner ton fichier <code>.docx</code>.
                </p>

                <motion.button
                  className="btn-import-word"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                >
                  {importing ? '⏳ Lecture en cours...' : '📂 Sélectionner le fichier .docx'}
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />

                <div className="word-manual">
                  <p className="admin-hint-small">
                    Ou indique le nom si le fichier est dans <code>public/words/</code> :
                  </p>
                  <div className="word-path-form">
                    <input
                      type="text"
                      className="name-input"
                      placeholder="ex: Quiz_Chimie TSE.docx"
                      value={wordFilename}
                      onChange={e => setWordFilename(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveWordPath()}
                    />
                    <button
                      className="btn-confirm-name"
                      onClick={handleSaveWordPath}
                      disabled={!wordFilename.trim() || importing}
                    >
                      {importing ? '⏳...' : '📥 Importer'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Message de statut */}
              <AnimatePresence>
                {status && (
                  <motion.div
                    className={`import-status ${status.type}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {status.msg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ✅ Bouton télécharger le JSON mis à jour */}
              <div className="word-download-zone">
                <h4>⬇️ Mettre à jour questions.json</h4>
                <p className="admin-hint-small">
                  Après avoir importé tes fichiers Word, télécharge le <code>questions.json</code> mis à jour
                  et remplace le fichier <code>src/data/questions.json</code> de ton projet.
                  Les questions seront ainsi intégrées définitivement.
                </p>
                <motion.button
                  className="btn-download-json"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDownloadJson}
                >
                  ⬇️ Télécharger questions.json
                </motion.button>
              </div>

              {/* Format attendu */}
              <div className="word-format-guide">
                <h4>📋 Formats acceptés dans le fichier Word</h4>
                <p className="admin-hint-small" style={{ marginBottom: '0.5rem' }}>
                  <strong>Format 1</strong> — Bonne réponse sur ligne séparée (<code>R:</code>) :
                </p>
                <pre className="format-example">{`Q: Combien font 2 + 2 ?
A: 3
B: 4
C: 5
D: 6
R: B`}</pre>
                <p className="admin-hint-small" style={{ margin: '0.6rem 0 0.4rem' }}>
                  <strong>Format 2</strong> — Bonne réponse marquée <code>(R)</code> sur la ligne :
                </p>
                <pre className="format-example">{`1) Deux molécules énantiomères sont :
A) Superposables et identiques
B) Images l'une de l'autre non superposables (R)
C) Différentes par leur formule brute
D) Différentes par leur fonction chimique`}</pre>
                <p className="admin-hint-small" style={{ marginTop: '0.5rem' }}>
                  Les deux formats peuvent coexister dans le même fichier.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}