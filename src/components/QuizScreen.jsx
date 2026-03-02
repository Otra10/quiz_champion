import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Timer from './Timer'
import ScoreBoard from './ScoreBoard'

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

export default function QuizScreen({
  level,
  subject,
  questions,
  currentStudent,
  players,
  onAddPlayer,
  onStudentFinished,
  onEnd,
  onReset,
}) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION)
  const [timedOut, setTimedOut] = useState(false)
  const [showResult, setShowResult] = useState(false)
  // Score de la session courante pour cet élève
  const [sessionScore, setSessionScore] = useState(0)

  const timerRef = useRef(null)

  const currentQuestion = questions[questionIndex]
  const isLastQuestion = questionIndex === questions.length - 1

  // Démarrer le timer à chaque nouvelle question
  useEffect(() => {
    if (answered) return
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
  }, [questionIndex])

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
      setSessionScore(s => s + POINTS_CORRECT)
    } else {
      playSound('wrong')
    }
  }

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // L'élève a terminé toutes les questions — on enregistre son score total
      onAddPlayer(currentStudent, sessionScore)
      onStudentFinished()
      return
    }
    setQuestionIndex(i => i + 1)
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
            <strong>{sessionScore} pts</strong>
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
                ? `🎉 Bravo ! +${POINTS_CORRECT} points !`
                : `❌ Dommage ! Bonne réponse : ${currentQuestion.options[currentQuestion.correctIndex]}`
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
                  ? `✅ Terminer (${currentStudent})`
                  : 'Question suivante →'}
              </motion.button>
              {!isLastQuestion && (
                <motion.button
                  className="btn-end-early"
                  onClick={() => {
                    onAddPlayer(currentStudent, sessionScore)
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
        <ScoreBoard players={players} />
      </div>
    </motion.div>
  )
}
