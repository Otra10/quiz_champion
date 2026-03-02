import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const TOTAL_TIME = 15

export default function Timer({ timeLeft, totalTime = TOTAL_TIME, isActive }) {
  const ratio = timeLeft / totalTime
  const isUrgent = timeLeft <= 5

  // Couleur de la barre selon le temps restant
  const barColor = timeLeft > 8
    ? 'var(--color-success)'
    : timeLeft > 4
    ? '#f0a500'
    : 'var(--color-danger)'

  const circumference = 2 * Math.PI * 28

  return (
    <div className={`timer-container ${isUrgent ? 'timer-urgent' : ''}`}>
      {/* Cercle SVG */}
      <svg className="timer-svg" viewBox="0 0 70 70" width="80" height="80">
        {/* Fond */}
        <circle cx="35" cy="35" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
        {/* Progression */}
        <motion.circle
          cx="35"
          cy="35"
          r="28"
          fill="none"
          stroke={barColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          transform="rotate(-90 35 35)"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
        {/* Texte */}
        <text
          x="35"
          y="40"
          textAnchor="middle"
          fill={barColor}
          fontSize="20"
          fontWeight="bold"
          fontFamily="Poppins, sans-serif"
        >
          {timeLeft}
        </text>
      </svg>

      {/* Barre de progression linéaire */}
      <div className="timer-bar-wrapper">
        <motion.div
          className="timer-bar"
          style={{ backgroundColor: barColor }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.9, ease: 'linear' }}
        />
      </div>
    </div>
  )
}
