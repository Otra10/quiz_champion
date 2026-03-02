import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import questionsData from '../data/questions.json'

const LEVELS = ['10e', '11e', 'TSE', 'TSEXp', 'SES', 'Sciences']
const SUBJECTS = ['Maths', 'Physique', 'Chimie', 'SVT', 'Histoire-Géographie', 'Économie']

const SUBJECT_ICONS = {
  'Maths': '📐',
  'Physique': '⚡',
  'Chimie': '🧪',
  'SVT': '🌿',
  'Histoire-Géographie': '🌍',
  'Économie': '💹',
}

const LEVEL_COLORS = {
  '10e': '#4f86c6',
  '11e': '#5c9e6e',
  'TSE': '#c47f3a',
  'TSEXp': '#9b59b6',
  'SES': '#e74c3c',
  'Sciences': '#1abc9c',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  exit: { opacity: 0, x: -60 },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function LevelSelection({ onSelect, onBack, getQuestionCount }) {
  const [selectedLevel, setSelectedLevel] = useState(null)

  const countFor = (level, subject) => {
    if (getQuestionCount) return getQuestionCount(level, subject)
    return questionsData[level]?.[subject]?.length || 0
  }

  const handleSubjectClick = (subject) => {
    const count = countFor(selectedLevel, subject)
    if (count === 0) {
      alert(`Aucune question disponible pour ${selectedLevel} - ${subject}`)
      return
    }
    onSelect(selectedLevel, subject)
  }

  return (
    <motion.div
      className="level-selection-screen"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.4 }}
    >
      <div className="selection-header">
        <button className="btn-back" onClick={onBack}>← Retour</button>
        <h2 className="selection-title">
          {selectedLevel ? `📚 Choisir une matière — ${selectedLevel}` : '🎓 Choisir un niveau'}
        </h2>
      </div>

      <AnimatePresence mode="wait">
        {!selectedLevel ? (
          <motion.div
            key="levels"
            className="cards-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {LEVELS.map(level => (
              <motion.button
                key={level}
                className="selection-card level-card"
                style={{ '--card-color': LEVEL_COLORS[level] }}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedLevel(level)}
              >
                <span className="card-label">{level}</span>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="subjects"
            className="cards-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {SUBJECTS.map(subject => {
              const count = countFor(selectedLevel, subject)
              const available = count > 0
              return (
                <motion.button
                  key={subject}
                  className={`selection-card subject-card ${!available ? 'disabled' : ''}`}
                  variants={itemVariants}
                  whileHover={available ? { scale: 1.05, y: -4 } : {}}
                  whileTap={available ? { scale: 0.97 } : {}}
                  onClick={() => available && handleSubjectClick(subject)}
                  disabled={!available}
                >
                  <span className="card-icon">{SUBJECT_ICONS[subject]}</span>
                  <span className="card-label">{subject}</span>
                  {available && (
                    <span className="card-count">
                      {count} question{count > 1 ? 's' : ''}
                    </span>
                  )}
                </motion.button>
              )
            })}

            <motion.button
              className="btn-back-level"
              variants={itemVariants}
              onClick={() => setSelectedLevel(null)}
            >
              ← Changer de niveau
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
