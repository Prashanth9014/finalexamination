import { useState, useEffect } from 'react'
import './Timer.css'

const Timer = ({ remainingSeconds, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(remainingSeconds)

  useEffect(() => {
    setTimeLeft(remainingSeconds)
  }, [remainingSeconds])

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onTimeUp])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isWarning = timeLeft < 300 // Less than 5 minutes
  const isCritical = timeLeft < 60 // Less than 1 minute

  return (
    <div className={`timer ${isWarning ? 'warning' : ''} ${isCritical ? 'critical' : ''}`}>
      <div className="timer-icon">⏱️</div>
      <div className="timer-text">
        <div className="timer-label">Time Remaining</div>
        <div className="timer-value">{formatTime(timeLeft)}</div>
      </div>
    </div>
  )
}

export default Timer