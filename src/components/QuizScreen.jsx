import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Timer from './Timer'
import ScoreBoard from './ScoreBoard'
import { useStudents } from '../hooks/useStudents'

const TIMER_DURATION = 15
const POINTS_CORRECT = 10

// Sons synthétiques via Web Audio API
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'correct') {
      osc.frequency.setValueAtTime(523, ctx.currentTime)
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } else if (type === 'timeout') {
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    }
  } catch {
    // Navigateur sans Web Audio API
  }
}

const optionLetters = ['A', 'B', 'C', 'D']

// ─── Sous-composant : sélection de l'élève pour la question courante ───
function StudentPicker({ questionIndex, totalQuestions, players, students, onStudentSelected, onEnd, onReset, level, subject }) {
  const [selected, setSelected] = useState(null)

  // Map nom → score actuel pour affichage
  const scoreMap = {}
  players.forEach(p => { scoreMap[p.name] = p.score })

  return (
    <motion.div
      className="student-picker-overlay"
      key={`picker-${questionIndex}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
    >
      <div className="picker-header">
        <div className="quiz-meta">
          <span className="quiz-level-badge">{level}</span>
          <span className="quiz-subject-badge">{subject}</span>
        </div>
        <div className="picker-progress">
          <span className="question-counter">
            Question {questionIndex + 1} / {totalQuestions}
          </span>
          <div className="progress-bar-wrapper">
            <motion.div
              className="progress-bar-fill"
              animate={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <button className="btn-reset-small" onClick={onReset} title="Réinitialiser">↺ Reset</button>
      </div>

      <div className="picker-body">
        <motion.h2
          className="picker-title"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          🎯 Qui répond à la question {questionIndex + 1} ?
        </motion.h2>

        <div className="picker-grid">
          {students.map((s, i) => {
            const score = scoreMap[s.name] ?? 0
            const isSelected = selected === s.name
            return (
              <motion.button
                key={s.name}
                className={`picker-card ${isSelected ? 'picker-card--selected' : ''}`}
                onClick={() => setSelected(s.name)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="picker-card-icon">{isSelected ? '✓' : '👤'}</span>
                <span className="picker-card-name">{s.name}</span>
                <span className="picker-card-score">{score} pts</span>
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              className="picker-confirm-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <motion.button
                className="btn-start-quiz"
                onClick={() => onStudentSelected(selected)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                🎯 <strong>{selected}</strong> répond →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {players.length > 0 && (
          <motion.button
            className="btn-end-early"
            onClick={onEnd}
            style={{ marginTop: '1rem' }}
            whileHover={{ scale: 1.02 }}
          >
            🏁 Terminer le concours
          </motion.button>
        )}
      </div>

      {/* Classement en sidebar */}
      <div className="quiz-sidebar picker-sidebar">
        <ScoreBoard players={players} />
      </div>
    </motion.div>
  )
}

// ─── Composant principal ───
export default function QuizScreen({
  level,
  subject,
  questions,
  players,
  onAddPlayer,
  onEnd,
  onReset,
}) {
  const { students } = useStudents()

  const [questionIndex, setQuestionIndex] = useState(0)
  const [currentStudent, setCurrentStudent] = useState(null) // null = phase sélection
  const [selectedOption, setSelectedOption] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION)
  const [timedOut, setTimedOut] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [sessionScores, setSessionScores] = useState({}) // scores cumulés par élève

  const timerRef = useRef(null)

  const currentQuestion = questions[questionIndex]
  const isLastQuestion = questionIndex === questions.length - 1

  // Démarrer le timer quand un élève est sélectionné
  useEffect(() => {
    if (!currentStudent || answered) return
    setTimeLeft(TIMER_DURATION)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [currentStudent, questionIndex])

  const handleTimeout = useCallback(() => {
    clearInterval(timerRef.current)
    setTimedOut(true)
    setAnswered(true)
    setShowResult(true)
    playSound('timeout')
  }, [])

  const handleOptionClick = (index) => {
    if (answered) return
    clearInterval(timerRef.current)

    setSelectedOption(index)
    setAnswered(true)
    setShowResult(true)

    const isCorrect = index === currentQuestion.correctIndex
    if (isCorrect) {
      playSound('correct')
      // Ajouter les points à l'élève courant
      setSessionScores(prev => ({
        ...prev,
        [currentStudent]: (prev[currentStudent] ?? 0) + POINTS_CORRECT
      }))
    } else {
      playSound('wrong')
    }
  }

  const handleNextQuestion = () => {
    // Enregistrer le score de l'élève courant (score cumulé total)
    const totalScore = (sessionScores[currentStudent] ?? 0)
    onAddPlayer(currentStudent, totalScore)

    if (isLastQuestion) {
      onEnd()
      return
    }

    // Revenir à la phase sélection pour la prochaine question
    setQuestionIndex(i => i + 1)
    setCurrentStudent(null)
    setSelectedOption(null)
    setAnswered(false)
    setTimedOut(false)
    setShowResult(false)
    clearInterval(timerRef.current)
  }

  const getOptionClass = (index) => {
    if (!showResult) return 'option-btn'
    if (index === currentQuestion.correctIndex) return 'option-btn correct'
    if (index === selectedOption && index !== currentQuestion.correctIndex) return 'option-btn wrong'
    return 'option-btn dimmed'
  }

  if (!currentQuestion) {
    return (
      <div className="quiz-screen">
        <p style={{ color: 'white', textAlign: 'center', fontSize: '1.5rem' }}>
          Aucune question disponible.
        </p>
        <button className="btn-next" onClick={onReset}>Retour à l'accueil</button>
      </div>
    )
  }

  // ── Phase 1 : sélection de l'élève ──
  if (!currentStudent) {
    // Construire la liste des joueurs avec scores actuels fusionnés
    const mergedPlayers = students.map(s => ({
      name: s.name,
      score: sessionScores[s.name] ?? (players.find(p => p.name === s.name)?.score ?? 0)
    }))

    return (
      <AnimatePresence mode="wait">
        <StudentPicker
          key={`picker-${questionIndex}`}
          questionIndex={questionIndex}
          totalQuestions={questions.length}
          players={mergedPlayers}
          students={students}
          onStudentSelected={(name) => setCurrentStudent(name)}
          onEnd={onEnd}
          onReset={onReset}
          level={level}
          subject={subject}
        />
      </AnimatePresence>
    )
  }

  // ── Phase 2 : l'élève répond ──
  return (
    <motion.div
      className="quiz-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Panneau gauche : question */}
      <div className="quiz-main">
        {/* En-tête */}
        <div className="quiz-header">
          <div className="quiz-meta">
            <span className="quiz-level-badge">{level}</span>
            <span className="quiz-subject-badge">{subject}</span>
          </div>
          <div className="quiz-progress">
            <span className="question-counter">
              Question {questionIndex + 1} / {questions.length}
            </span>
            <div className="progress-bar-wrapper">
              <motion.div
                className="progress-bar-fill"
                animate={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <button className="btn-reset-small" onClick={onReset} title="Réinitialiser">
            ↺ Reset
          </button>
        </div>

        {/* Élève actuel + score session */}
        <div className="quiz-player-row">
          <div className="current-player">
            <span className="player-icon">👤</span>
            <span className="player-current-name">{currentStudent}</span>
          </div>
          <div className="session-score-badge">
            <span>Score : </span>
            <strong>{sessionScores[currentStudent] ?? 0} pts</strong>
          </div>
          <Timer timeLeft={timeLeft} totalTime={TIMER_DURATION} isActive={!answered} />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={questionIndex}
            className="question-box"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <p className="question-text">{currentQuestion.question}</p>
          </motion.div>
        </AnimatePresence>

        {/* Options */}
        <div className="options-grid">
          {currentQuestion.options.map((option, index) => (
            <motion.button
              key={index}
              className={getOptionClass(index)}
              onClick={() => handleOptionClick(index)}
              disabled={answered}
              whileHover={!answered ? { scale: 1.03 } : {}}
              whileTap={!answered ? { scale: 0.97 } : {}}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.07 }}
            >
              <span className="option-letter">{optionLetters[index]}</span>
              <span className="option-text">{option}</span>
              {showResult && index === currentQuestion.correctIndex && (
                <motion.span
                  className="option-check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  ✓
                </motion.span>
              )}
              {showResult && index === selectedOption && index !== currentQuestion.correctIndex && (
                <motion.span
                  className="option-cross"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✗
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Message résultat */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              className={`result-message ${timedOut ? 'timeout' : selectedOption === currentQuestion.correctIndex ? 'success' : 'failure'}`}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {timedOut
                ? `⏰ Temps écoulé ! Bonne réponse : ${currentQuestion.options[currentQuestion.correctIndex]}`
                : selectedOption === currentQuestion.correctIndex
                ? `🎉 Bravo ${currentStudent} ! +${POINTS_CORRECT} points !`
                : `❌ Dommage ${currentStudent} ! Bonne réponse : ${currentQuestion.options[currentQuestion.correctIndex]}`
              }
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton suivant */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              className="next-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <motion.button
                className="btn-next"
                onClick={handleNextQuestion}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                {isLastQuestion
                  ? '✅ Terminer le quiz'
                  : 'Question suivante →'}
              </motion.button>
              {!isLastQuestion && (
                <motion.button
                  className="btn-end-early"
                  onClick={() => {
                    onAddPlayer(currentStudent, sessionScores[currentStudent] ?? 0)
                    onEnd()
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  🏁 Terminer le concours
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Panneau droit : classement */}
      <div className="quiz-sidebar">
        <ScoreBoard players={
          students.map(s => ({
            name: s.name,
            score: sessionScores[s.name] ?? (players.find(p => p.name === s.name)?.score ?? 0)
          }))
        } />
      </div>
    </motion.div>
  )
}