import { motion } from 'framer-motion'

const PODIUM_CONFIG = [
  { rank: 2, medal: '🥈', label: '2ème', height: 140, color: '#a8b8c8', delay: 0.4 },
  { rank: 1, medal: '🥇', label: '1er', height: 200, color: '#ffd700', delay: 0.1 },
  { rank: 3, medal: '🥉', label: '3ème', height: 100, color: '#cd7f32', delay: 0.7 },
]

const confettiColors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7']

export default function FinalPodium({ players, onReset, onNewRound }) {
  const top3 = players.slice(0, 3)

  return (
    <motion.div
      className="podium-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Confettis animés */}
      <div className="confetti-container">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: confettiColors[i % confettiColors.length],
              width: `${Math.random() * 10 + 6}px`,
              height: `${Math.random() * 10 + 6}px`,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
            }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: '110vh',
              opacity: [1, 1, 0],
              rotate: Math.random() * 720 - 360,
              x: (Math.random() - 0.5) * 200,
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              repeatDelay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Titre */}
      <motion.h1
        className="podium-title"
        initial={{ opacity: 0, y: -40, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: 'backOut' }}
      >
        🏆 Palmarès Final 🏆
      </motion.h1>

      {players.length === 0 ? (
        <motion.p
          className="podium-empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Aucun joueur n'a participé.
        </motion.p>
      ) : (
        <>
          {/* Podium visuel */}
          <div className="podium-stage">
            {PODIUM_CONFIG.map(({ rank, medal, label, height, color, delay }) => {
              const player = top3[rank - 1]
              if (!player) return null
              return (
                <div key={rank} className="podium-slot">
                  {/* Nom et médaille au-dessus */}
                  <motion.div
                    className="podium-player-info"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay + 0.3, duration: 0.5 }}
                  >
                    <motion.span
                      className="podium-medal"
                      animate={{ rotate: [-10, 10, -10], scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: rank * 0.3 }}
                    >
                      {medal}
                    </motion.span>
                    <span className="podium-player-name">{player.name}</span>
                    <span className="podium-player-score">{player.score} pts</span>
                  </motion.div>

                  {/* Bloc podium */}
                  <motion.div
                    className="podium-block"
                    style={{ height, backgroundColor: color }}
                    initial={{ scaleY: 0, originY: 1 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay, duration: 0.6, ease: 'backOut' }}
                  >
                    <span className="podium-rank-label">{label}</span>
                  </motion.div>
                </div>
              )
            })}
          </div>

          {/* Classement complet */}
          {players.length > 3 && (
            <motion.div
              className="podium-full-ranking"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <h3>Classement complet</h3>
              <ol>
                {players.map((player, index) => (
                  <li key={player.name} className="full-rank-item">
                    <span className="full-rank-pos">{index + 1}.</span>
                    <span className="full-rank-name">{player.name}</span>
                    <span className="full-rank-score">{player.score} pts</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          )}
        </>
      )}

      {/* Boutons d'action */}
      <motion.div
        className="podium-actions"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
      >
        <motion.button
          className="btn-new-round"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewRound}
        >
          🔄 Nouvelle manche
        </motion.button>
        <motion.button
          className="btn-reset-full"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onReset}
        >
          🏠 Retour à l'accueil
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
