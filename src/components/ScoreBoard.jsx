import { motion, AnimatePresence } from 'framer-motion'

const MEDALS = ['🥇', '🥈', '🥉']

export default function ScoreBoard({ players }) {
  return (
    <div className="scoreboard">
      <h3 className="scoreboard-title">🏆 Classement</h3>
      {players.length === 0 ? (
        <p className="scoreboard-empty">Aucun joueur encore</p>
      ) : (
        <ol className="scoreboard-list">
          <AnimatePresence>
            {players.map((player, index) => (
              <motion.li
                key={player.name}
                className={`scoreboard-item rank-${index + 1}`}
                layout
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <span className="rank-medal">
                  {MEDALS[index] || `${index + 1}.`}
                </span>
                <span className="player-name">{player.name}</span>
                <span className="player-score">{player.score} pts</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </div>
  )
}
