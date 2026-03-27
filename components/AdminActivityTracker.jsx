'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminActivityTracker() {
  const router = useRouter()
  const [warningShown, setWarningShown] = useState(false)
  const [timeLeft, setTimeLeft] = useState(480) // 8 minutes in seconds

  useEffect(() => {
    const sessionTimeout = 8 * 60 * 1000 // 8 minutes
    const warningTime = 1 * 60 * 1000 // 1 minute before timeout
    let timeoutId
    let warningTimeoutId
    let countdownInterval

    const resetTimeout = () => {
      clearTimeout(timeoutId)
      clearTimeout(warningTimeoutId)
      clearInterval(countdownInterval)
      setWarningShown(false)
      setTimeLeft(480)

      // Set warning timeout
      warningTimeoutId = setTimeout(() => {
        setWarningShown(true)
        
        // Start countdown
        let countdown = 60 // 1 minute
        countdownInterval = setInterval(() => {
          countdown -= 1
          setTimeLeft(countdown)
          
          if (countdown <= 0) {
            clearInterval(countdownInterval)
          }
        }, 1000)
      }, sessionTimeout - warningTime)

      // Set logout timeout
      timeoutId = setTimeout(async () => {
        await logout()
      }, sessionTimeout)
    }

    const logout = async () => {
      try {
        await fetch('/api/admin/logout', { method: 'POST' })
      } catch (error) {
        console.error('Logout error:', error)
      }
      router.push('/okero/login')
    }

    const handleActivity = () => {
      fetch('/api/admin/activity', { method: 'POST' }).catch(() => {})
      resetTimeout()
    }

    // Activity events
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
    ]

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Initial timeout setup
    resetTimeout()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      clearTimeout(timeoutId)
      clearTimeout(warningTimeoutId)
      clearInterval(countdownInterval)
    }
  }, [router])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!warningShown) return null

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#ff6b6b',
      color: 'white',
      padding: '15px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        ⚠️ Session Expiring Soon
      </div>
      <div style={{ fontSize: '14px' }}>
        Your session will expire in {formatTime(timeLeft)} due to inactivity.
      </div>
      <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>
        Move your mouse or type to extend session.
      </div>
    </div>
  )
}
