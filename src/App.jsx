import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Home from './components/Home'
import LevelSelection from './components/LevelSelection'
import StudentSelect from './components/StudentSelect'
import QuizScreen from './components/QuizScreen'
import FinalPodium from './components/FinalPodium'
import AdminPanel from './components/AdminPanel'
import { useQuestions } from './hooks/useQuestions'

const SCREENS = {
  HOME: 'home',
  ADMIN: 'admin',
  LEVEL_SELECTION: 'level_selection',
  STUDENT_SELECT: 'student_select',
  QUIZ: 'quiz',
  PODIUM: 'podium',
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.HOME)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [currentStudent, setCurrentStudent] = useState(null)
  const [players, setPlayers] = useState([])
  const [darkMode, setDarkMode] = useState(true)

  // ✅ importQuestions remplace handleQuestionsImported + wordImported
  const { getQuestions, hasCustom, addQuestion, importQuestions } = useQuestions()

  // Les questions Word importées sont maintenant sauvegardées dans localStorage
  // via importQuestions → plus besoin de wordImported ni de getActiveQuestions séparé

  const getQuestionCount = (level, subject) => getQuestions(level, subject).length

  const addOrUpdatePlayer = (name, score) => {
    setPlayers(prev => {
      const existing = prev.find(p => p.name === name)
      if (existing) {
        return prev
          .map(p => p.name === name ? { ...p, score: p.score + score } : p)
          .sort((a, b) => b.score - a.score)
      }
      return [...prev, { name, score }].sort((a, b) => b.score - a.score)
    })
  }

  const handleReset = () => {
    setPlayers([])
    setSelectedLevel(null)
    setSelectedSubject(null)
    setCurrentStudent(null)
    setScreen(SCREENS.HOME)
  }

  const handleStudentFinished = () => {
    setCurrentStudent(null)
    setScreen(SCREENS.STUDENT_SELECT)
  }

  return (
    <div className={darkMode ? 'app dark' : 'app'}>
      <button
        className="dark-mode-toggle"
        onClick={() => setDarkMode(d => !d)}
        title={darkMode ? 'Mode clair' : 'Mode sombre'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      <AnimatePresence mode="wait">
        {screen === SCREENS.HOME && (
          <Home
            key="home"
            onStart={() => setScreen(SCREENS.LEVEL_SELECTION)}
            onAdmin={() => setScreen(SCREENS.ADMIN)}
          />
        )}

        {screen === SCREENS.ADMIN && (
          <AdminPanel
            key="admin"
            onBack={() => setScreen(SCREENS.HOME)}
            // ✅ On passe importQuestions à AdminPanel
            onQuestionsImported={(level, subject, questions) =>
              importQuestions(level, subject, questions, 'replace')
            }
          />
        )}

        {screen === SCREENS.LEVEL_SELECTION && (
          <LevelSelection
            key="level"
            getQuestionCount={getQuestionCount}
            onSelect={(level, subject) => {
              setSelectedLevel(level)
              setSelectedSubject(subject)
              setScreen(SCREENS.STUDENT_SELECT)
            }}
            onBack={() => setScreen(SCREENS.HOME)}
          />
        )}

        {screen === SCREENS.STUDENT_SELECT && (
          <StudentSelect
            key="student"
            onStudentReady={(name) => {
              setCurrentStudent(name)
              setScreen(SCREENS.QUIZ)
            }}
            onBack={() => setScreen(SCREENS.LEVEL_SELECTION)}
            onEndContest={() => setScreen(SCREENS.PODIUM)}
            players={players}
          />
        )}

        {screen === SCREENS.QUIZ && (
          <QuizScreen
            key={`quiz-${currentStudent}`}
            level={selectedLevel}
            subject={selectedSubject}
            questions={getQuestions(selectedLevel, selectedSubject)}
            currentStudent={currentStudent}
            players={players}
            onAddPlayer={addOrUpdatePlayer}
            onStudentFinished={handleStudentFinished}
            onEnd={() => setScreen(SCREENS.PODIUM)}
            onReset={handleReset}
          />
        )}

        {screen === SCREENS.PODIUM && (
          <FinalPodium
            key="podium"
            players={players}
            onReset={handleReset}
            onNewRound={() => {
              setPlayers([])
              setScreen(SCREENS.LEVEL_SELECTION)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}