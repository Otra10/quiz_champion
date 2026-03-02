import { motion } from 'framer-motion'

const starVariants = {
  animate: {
    scale: [1, 1.3, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
}

const titleVariants = {
  hidden: { opacity: 0, y: -60, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: 'backOut' },
  },
}

const subtitleVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.5 },
  },
}

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: 1.0, ease: 'backOut' },
  },
  hover: { scale: 1.07, boxShadow: '0 0 30px rgba(255,215,0,0.6)' },
  tap: { scale: 0.96 },
}

const handleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

export default function Home({ onStart, onAdmin }) {
  return (
    <motion.div
      className="home-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      {/* Étoiles décoratives */}
      <div className="stars-container">
        {[...Array(12)].map((_, i) => (
          <motion.span
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 90 + 5}%`,
              top: `${Math.random() * 80 + 5}%`,
              fontSize: `${Math.random() * 18 + 10}px`,
              animationDelay: `${i * 0.3}s`,
            }}
            variants={starVariants}
            animate="animate"
          >
            ★
          </motion.span>
        ))}
      </div>

      <div className="home-content">
        {/* Trophée */}
        <motion.div
          className="trophy"
          animate={{ rotate: [-5, 5, -5], y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          🏆
        </motion.div>

        {/* Titre principal */}
        <motion.h1
          className="home-title"
          variants={titleVariants}
          initial="hidden"
          animate="visible"
        >
          Quiz des
          <br />
          <span className="title-champions">Champions</span>
        </motion.h1>

        {/* Sous-titre */}
        <motion.p
          className="home-subtitle"
          variants={subtitleVariants}
          initial="hidden"
          animate="visible"
        >
          Le grand concours de connaissances
        </motion.p>

        {/* Bouton principal */}
        <motion.button
          className="btn-start"
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
          onClick={onStart}
        >
          🎯 Commencer le concours
        </motion.button>

        {/* Boutons secondaires */}
        <motion.div
          className="home-secondary-btns"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <button className="btn-fullscreen" onClick={handleFullscreen} title="Plein écran">
            ⛶ Plein écran
          </button>
          <button className="btn-admin" onClick={onAdmin} title="Panneau de gestion">
            ⚙️ Gestion
          </button>
        </motion.div>
      </div>

      {/* Décorations bas de page */}
      <motion.div
        className="home-footer-deco"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <span>🥇</span>
        <span>🥈</span>
        <span>🥉</span>
      </motion.div>
    </motion.div>
  )
}
