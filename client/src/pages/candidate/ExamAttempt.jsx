import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import Timer from '../../components/Timer'
import { examService } from '../../services/examService'
import { submissionService } from '../../services/submissionService'
import { codeExecutionService } from '../../services/codeExecutionService'
import './Candidate.css'

// Module-level flag — survives React component teardown during navigation.
// Set to true just before window.location.replace() so beforeunload knows
// this is a controlled modal reload and must NOT count a second violation.
let isManualReloadPending = false

const ExamAttempt = () => {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [remainingTime, setRemainingTime] = useState(0)
  const [answers, setAnswers] = useState({})
  const [codingLanguages, setCodingLanguages] = useState({}) // Track language per coding question
  const [codeOutputs, setCodeOutputs] = useState({}) // Track execution output per coding question
  const [codeRunning, setCodeRunning] = useState({}) // Track running state per coding question
  const [codeSaving, setCodeSaving] = useState({}) // Track saving state per coding question
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentSection, setCurrentSection] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0) // Track current question in section
  const [isSubmittingExam, setIsSubmittingExam] = useState(false) // Track intentional fullscreen exit
  const [showResumeOverlay, setShowResumeOverlay] = useState(false) // Show resume exam overlay
  const [isFirstFullscreenActivation, setIsFirstFullscreenActivation] = useState(true) // Track if this is first fullscreen activation
  const [isExamBlocked, setIsExamBlocked] = useState(false) // Block exam UI when fullscreen is exited after refresh
  const [reloadViolationCount, setReloadViolationCount] = useState(0) // Violation count to show after reload
  const [showCancelRestoreOverlay, setShowCancelRestoreOverlay] = useState(false) // Blocking overlay after Ctrl+R cancel
  const [showSubmitModal, setShowSubmitModal] = useState(false) // Custom submit confirmation modal
  const [showReloadModal, setShowReloadModal] = useState(false) // Custom reload warning modal
  const [showSectionWarningModal, setShowSectionWarningModal] = useState(false)
  const [pendingSectionIndex, setPendingSectionIndex] = useState(null)
  const [showWriteCodeModal, setShowWriteCodeModal] = useState(false)

  // Custom Modal System - Replace all browser alerts with React modals
  const [showViolationModal, setShowViolationModal] = useState(false)
  const [violationModalData, setViolationModalData] = useState({
    type: '', // 'tab-switch', 'fullscreen-exit', 'offline', 'terminated'
    title: '',
    message: '',
    violationCount: 0,
    maxViolations: 3
  })
  const [showOfflineModal, setShowOfflineModal] = useState(false)
  const [showCodeErrorModal, setShowCodeErrorModal] = useState(false)

  // Professional Violation Handling System
  // Based on industry standards used by major proctoring companies
  const lastViolationTimeRef = useRef(0) // Debounce protection for violations
  const isAlertOpenRef = useRef(false) // Prevent violations while alert is active
  const activeViolationSessionRef = useRef(null) // Track active violation session
  const pendingEventsRef = useRef(new Set()) // Track pending browser events

  // Custom Modal Functions - Replace browser alerts
  const showViolationAlert = (type, violationCount, maxViolations = 3) => {
    const modalData = {
      type,
      violationCount,
      maxViolations
    }

    switch (type) {
      case 'tab-switch':
        modalData.title = 'Proctoring Alert'
        modalData.message = 'Tab switching detected during exam'
        break
      case 'fullscreen-exit':
        modalData.title = 'Proctoring Alert'
        modalData.message = 'Fullscreen mode was exited during exam'
        break
      case 'shortcut-blocked':
        modalData.title = 'Action Blocked'
        modalData.message = 'This keyboard shortcut is not allowed during the exam'
        break
      case 'terminated':
        modalData.title = 'Exam Terminated'
        modalData.message = 'Maximum violations exceeded due to suspicious activity'
        break
      default:
        modalData.title = 'Proctoring Alert'
        modalData.message = 'Violation detected during exam'
    }

    setViolationModalData(modalData)
    setShowViolationModal(true)
    
    // Mark alert as active to prevent additional violations
    isAlertOpenRef.current = true
  }

  const closeViolationModal = () => {
    setShowViolationModal(false)
    
    // Check if exam should be terminated
    if (violationModalData.type === 'terminated') {
      handleSubmitDueToViolation()
      return
    }
    
    // Professional dialog cleanup - prevents click-related violations
    setTimeout(() => {
      isAlertOpenRef.current = false
      console.log(`[PROCTORING] Custom modal cleared - resuming violation monitoring`)
    }, 500) // Shorter delay since it's a custom modal, not browser alert
  }

  const showOfflineAlert = () => {
    if (isOfflineAlertShownRef.current) return
    isOfflineAlertShownRef.current = true
    setShowOfflineModal(true)
  }

  const closeOfflineModal = () => {
    setShowOfflineModal(false)
  }

  const showCodeAlert = () => {
    setShowCodeErrorModal(true)
  }

  const closeCodeErrorModal = () => {
    setShowCodeErrorModal(false)
  }
  // Professional violation detection - groups related events into single violations
  const countViolation = (reason, eventType = 'user_action', forceCount = false) => {
    const now = Date.now()
    
    // Block violations during alerts (custom modals)
    if (isAlertOpenRef.current) {
      console.log(`[PROCTORING] Violation blocked - custom modal active: ${reason}`)
      return getViolationCount()
    }

    // Professional Event Grouping System
    // Groups multiple browser events from single user action
    if (activeViolationSessionRef.current) {
      const timeSinceSession = now - activeViolationSessionRef.current.startTime
      const sessionWindow = 2000 // 2-second window for event grouping
      
      if (timeSinceSession < sessionWindow) {
        // Add event to current session
        activeViolationSessionRef.current.events.push({
          reason,
          eventType,
          timestamp: now
        })
        
        console.log(`[PROCTORING] Event grouped into active session: ${reason}`)
        console.log(`[PROCTORING] Session events: ${activeViolationSessionRef.current.events.map(e => e.reason).join(', ')}`)
        
        return getViolationCount()
      } else {
        // Previous session expired, clear it
        console.log(`[PROCTORING] Previous violation session completed with ${activeViolationSessionRef.current.events.length} events`)
        activeViolationSessionRef.current = null
      }
    }

    // Start new violation session
    activeViolationSessionRef.current = {
      startTime: now,
      primaryReason: reason,
      events: [{
        reason,
        eventType,
        timestamp: now
      }]
    }

    // Count the violation
    lastViolationTimeRef.current = now
    const currentCount = getViolationCount()
    const newCount = currentCount + 1
    localStorage.setItem(`violations_${examId}`, newCount.toString())
    
    console.log(`[PROCTORING] NEW VIOLATION DETECTED: ${reason}`)
    console.log(`[PROCTORING] Violation count: ${newCount}/3`)
    console.log(`[PROCTORING] Started violation session - grouping window: 2000ms`)
    
    // Show custom modal instead of browser alert
    if (newCount > 3) {
      showViolationAlert('terminated', newCount, 3)
    } else {
      // Determine violation type for appropriate modal
      let violationType = 'general'
      if (reason.includes('Tab switch')) violationType = 'tab-switch'
      else if (reason.includes('Fullscreen exit')) violationType = 'fullscreen-exit'
      else if (reason.includes('shortcut') || reason.includes('Blocked')) violationType = 'shortcut-blocked'
      
      showViolationAlert(violationType, newCount, 3)
    }
    
    // Auto-clear session after window expires
    setTimeout(() => {
      if (activeViolationSessionRef.current && activeViolationSessionRef.current.startTime === now) {
        console.log(`[PROCTORING] Violation session auto-cleared`)
        activeViolationSessionRef.current = null
      }
    }, 2000)
    
    return newCount
  }

  // Refs that mirror state so event handlers always see current values
  // without needing to re-register listeners on every render
  const submissionRef = useRef(null)
  const isSubmittingExamRef = useRef(false)
  const isFirstFullscreenActivationRef = useRef(true)
  const isExamBlockedRef = useRef(false)

  // Flag set in beforeunload so visibilitychange / fullscreenchange
  // know the page is unloading and must NOT count a violation
  const isUnloadingRef = useRef(false)

  // Set true on Ctrl+R / F5 keydown — fires BEFORE fullscreenchange,
  // so the fullscreen handler can distinguish reload-key exit from normal exit
  const isReloadKeyPressedRef = useRef(false)

  // Flag to suppress violation triggers while a submit confirmation dialog is open.
  // window.confirm() causes fullscreenchange/visibilitychange to fire — these must
  // not be counted as violations since the user is doing a legitimate action.
  const isConfirmDialogOpenRef = useRef(false)

  // Set true just before a manual (user-confirmed) reload so beforeunload
  // and fullscreenchange know NOT to count an extra violation.
  const isManualReloadRef = useRef(false)

  // Internet connectivity warning system
  const isOfflineAlertShownRef = useRef(false) // Prevent multiple offline alerts

  // Keep refs in sync with state so event handlers always read current values
  useEffect(() => { submissionRef.current = submission }, [submission])
  useEffect(() => { isSubmittingExamRef.current = isSubmittingExam }, [isSubmittingExam])
  useEffect(() => { isFirstFullscreenActivationRef.current = isFirstFullscreenActivation }, [isFirstFullscreenActivation])
  useEffect(() => { isExamBlockedRef.current = isExamBlocked }, [isExamBlocked])

  const getViolationCount = () => {
    const stored = localStorage.getItem(`violations_${examId}`)
    return stored ? parseInt(stored, 10) : 0
  }

  const incrementViolation = (reason) => {
    // Legacy helper for handleSubmitDueToViolation compatibility
    return countViolation(reason, true) // Force count for auto-submit scenarios
  }

  const handleSubmitDueToViolation = async () => {
    console.log('Auto-submitting exam due to violation limit exceeded')
    setIsSubmittingExam(true)

    try {
      // Use existing handleSubmit logic but skip confirmation
      await performExamSubmission()
    } catch (err) {
      console.error('Failed to auto-submit exam:', err)
    }
  }

  // Internet connectivity handlers - Use custom modals
  const handleOffline = () => {
    showOfflineAlert()
  }

  const handleOnline = () => {
    isOfflineAlertShownRef.current = false
    setShowOfflineModal(false)
    console.log('Internet connection restored')
  }

  useEffect(() => {
    startExam()
  }, [examId])

  // Set session flag when component mounts (first time visiting this exam page)
  useEffect(() => {
    // Check if this is a reload that happened during an active exam.
    // beforeunload sets 'reloadViolation' in sessionStorage just before the page
    // unloads, so we can detect it here after the page reloads.
    const wasReload = sessionStorage.getItem(`reloadViolation_${examId}`)
    if (wasReload) {
      // Clear the flag immediately so it doesn't fire again on next mount
      sessionStorage.removeItem(`reloadViolation_${examId}`)
      const count = getViolationCount()
      if (count > 3) {
        setIsExamBlocked(true)
      } else {
        // Show the violation warning popup after reload
        setReloadViolationCount(count)
      }
    }

    // Mark that this exam page has been loaded in this session.
    // This flag is used to detect resume vs first-start for fullscreen logic.
    // We set it AFTER the reload check above so startExam can read it correctly.
    sessionStorage.setItem(`examPageLoaded_${examId}`, 'true')
  }, [examId])

  // Check if exam is in progress and store submission ID
  useEffect(() => {
    if (submission && submission._id && submission.status === 'in-progress') {
      // Store the active submission ID
      sessionStorage.setItem('activeSubmissionId', submission._id)
    }
  }, [submission])

  // Check for page refresh scenario - if exam is in progress but not in fullscreen, show resume overlay immediately
  useEffect(() => {
    if (submission && submission.status === 'in-progress' && !loading) {
      // Check violation count first
      const violationCount = getViolationCount()
      if (violationCount > 3) {
        // Block resume if violations exceeded
        setIsExamBlocked(true)
        handleSubmitDueToViolation()
        return
      }

      // Check if fullscreen was previously entered (stored in sessionStorage)
      const fullscreenWasEntered = sessionStorage.getItem(`fullscreenEntered_${examId}`)

      // Check if we're currently not in fullscreen
      const isInFullscreen = document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement

      // If fullscreen was entered before but we're not in fullscreen now, this is a refresh
      if (fullscreenWasEntered && !isInFullscreen && !isSubmittingExam) {
        setIsFirstFullscreenActivation(false) // Mark that fullscreen was entered before
        setIsExamBlocked(true)
        setShowResumeOverlay(true)
      }
    }
  }, [submission, loading, isSubmittingExam, examId])

  // Helper function to request fullscreen with browser compatibility
  const requestFullscreen = () => {
    const elem = document.documentElement

    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err)
      })
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen()
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen()
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen()
    }
  }

  // Helper function to exit fullscreen with browser compatibility
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.warn('Exit fullscreen failed:', err)
      })
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }

  // Handle resume exam button click
  const handleResumeExam = () => {
    setShowResumeOverlay(false)
    setIsExamBlocked(false) // Unblock exam when resuming
    requestFullscreen()
  }

  // Initialize coding questions with default language and starter code
  useEffect(() => {
    if (exam && exam.sections) {
      const initialLanguages = {}
      const initialAnswers = {}

      exam.sections.forEach((section, sectionIndex) => {
        section.questions.forEach((question, questionIndex) => {
          if (question.type === 'coding') {
            const questionId = `${sectionIndex}-${questionIndex}`
            // Set default language to python if not already set
            if (!codingLanguages[questionId]) {
              initialLanguages[questionId] = 'python'
            }
            // Set starter code if answer is empty
            if (!answers[questionId]) {
              const language = codingLanguages[questionId] || 'python'
              initialAnswers[questionId] = question.starterCode || getDefaultStarterCode(language)
            }
          }
        })
      })

      if (Object.keys(initialLanguages).length > 0) {
        setCodingLanguages(prev => ({ ...prev, ...initialLanguages }))
      }
      if (Object.keys(initialAnswers).length > 0) {
        setAnswers(prev => ({ ...prev, ...initialAnswers }))
      }
    }
  }, [exam])

  // beforeunload: count exactly ONE violation for any Ctrl+R attempt.
  // Sets sessionStorage flag so the after-reload popup works.
  // Cancel detection is handled by visibilitychange (page becomes visible again).
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const sub = submissionRef.current
      if (!sub || sub.status !== 'in-progress') return
      if (isConfirmDialogOpenRef.current) return // submit confirm dialog — not a violation

      // Manual reload from our modal — violation already counted in the button handler.
      // Do NOT call e.preventDefault() so the browser shows NO popup and unloads cleanly.
      if (isManualReloadPending) return

      isUnloadingRef.current = true

      // Count exactly ONE violation using centralized function
      const newCount = countViolation('Page reload', true) // Force count for reload
      console.log(`Reload violation counted. Total: ${newCount}/3`)

      // Flag persists across reload — mount useEffect reads it to show popup
      sessionStorage.setItem(`reloadViolation_${examId}`, 'true')

      e.preventDefault()
      e.returnValue = 'Your exam is in progress. Are you sure you want to leave?'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [examId])

  // Internet connectivity monitoring
  useEffect(() => {
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Check initial offline state - Use custom modal
  useEffect(() => {
    if (!navigator.onLine && !isOfflineAlertShownRef.current) {
      showOfflineAlert()
    }
  }, [])

  // Fullscreen enforcement, tab-switch detection, and cancel detection.
  // Registered ONCE — all state read via refs, no stale closures, no duplicate listeners.
  useEffect(() => {
    let fullscreenCheckTimeout = null

    const isInFullscreen = () =>
      !!(document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement)

    // Professional Keyboard Shortcut Detection System
    // Detects all common violation shortcuts used in professional proctoring
    const handleKeyDown = (e) => {
      const sub = submissionRef.current
      if (!sub || sub.status !== 'in-progress') return
      if (isConfirmDialogOpenRef.current) return

      // Professional Violation Shortcut Detection
      const violationShortcuts = {
        // Tab switching shortcuts
        'Alt+Tab': e.altKey && e.key === 'Tab',
        'Ctrl+Tab': e.ctrlKey && e.key === 'Tab',
        'Cmd+Tab': e.metaKey && e.key === 'Tab', // Mac
        
        // Window management shortcuts
        'Windows+Tab': e.metaKey && e.key === 'Tab', // Windows Task View
        'Alt+Esc': e.altKey && e.key === 'Escape',
        'Ctrl+Alt+Tab': e.ctrlKey && e.altKey && e.key === 'Tab',
        
        // Application switching
        'Alt+F4': e.altKey && e.key === 'F4',
        'Cmd+Q': e.metaKey && e.key === 'q', // Mac Quit
        'Cmd+W': e.metaKey && e.key === 'w', // Mac Close Window
        
        // System shortcuts
        'Ctrl+Shift+Esc': e.ctrlKey && e.shiftKey && e.key === 'Escape', // Task Manager
        'Windows+L': e.metaKey && e.key === 'l', // Lock Screen
        'Windows+D': e.metaKey && e.key === 'd', // Show Desktop
        'Windows+M': e.metaKey && e.key === 'm', // Minimize All
        
        // Browser shortcuts that could be violations
        'Ctrl+Shift+N': e.ctrlKey && e.shiftKey && e.key === 'N', // Incognito
        'Ctrl+Shift+T': e.ctrlKey && e.shiftKey && e.key === 'T', // Reopen Tab
        'Ctrl+N': e.ctrlKey && e.key === 'n', // New Window
        'Ctrl+T': e.ctrlKey && e.key === 't', // New Tab
        'Ctrl+W': e.ctrlKey && e.key === 'w', // Close Tab
        
        // Developer tools
        'F12': e.key === 'F12',
        'Ctrl+Shift+I': e.ctrlKey && e.shiftKey && e.key === 'I',
        'Ctrl+Shift+J': e.ctrlKey && e.shiftKey && e.key === 'J',
        'Ctrl+U': e.ctrlKey && e.key === 'u', // View Source
      }

      // Check for violation shortcuts
      for (const [shortcutName, isPressed] of Object.entries(violationShortcuts)) {
        if (isPressed) {
          e.preventDefault()
          e.stopPropagation()
          
          console.log(`[PROCTORING] Blocked violation shortcut: ${shortcutName}`)
          countViolation(`Blocked shortcut: ${shortcutName}`, 'keyboard_shortcut')
          return
        }
      }

      // Handle reload shortcuts separately (show custom modal)
      const isReloadKey = (e.ctrlKey && (e.key === 'r' || e.key === 'R')) || e.key === 'F5'
      if (isReloadKey) {
        e.preventDefault()
        e.stopPropagation()
        console.log(`[PROCTORING] Blocked reload attempt - showing custom modal`)
        setShowReloadModal(true)
        return
      }

      // Handle ESC key (fullscreen exit attempt)
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        console.log(`[PROCTORING] Blocked ESC key - potential fullscreen exit attempt`)
        countViolation('ESC key pressed', 'keyboard_shortcut')
        return
      }
    }

    // visibilitychange: tab switch / window minimize detection only.
    const handleVisibilityChange = () => {
      const sub = submissionRef.current
      if (!sub || sub.status !== 'in-progress' || isSubmittingExamRef.current) return
      if (isConfirmDialogOpenRef.current) return // submit confirm dialog — not a violation
      if (isManualReloadPending) return // manual modal reload — not a violation

      // Skip if hidden due to Ctrl+R dialog
      if (document.hidden && (isReloadKeyPressedRef.current || isUnloadingRef.current)) return

      // Normal tab switch / window minimize - Use custom modal system
      if (document.hidden && !isAlertOpenRef.current) {
        const newCount = countViolation('Tab switch', 'user_action')
        // Custom modal is shown by countViolation function
      }
    }

    // pageshow: reset unloading flag (fires after reload dialog dismissed)
    const handlePageShow = () => {
      isUnloadingRef.current = false
    }

    const handleFullscreenChange = () => {
      const sub = submissionRef.current
      if (!sub || sub.status !== 'in-progress') return
      if (isSubmittingExamRef.current) return
      if (isConfirmDialogOpenRef.current) return // submit confirm dialog — not a violation
      if (isManualReloadRef.current || isManualReloadPending) return // user-confirmed reload — ignore fullscreen exit

      if (!isInFullscreen()) {
        if (fullscreenCheckTimeout) clearTimeout(fullscreenCheckTimeout)

        // Suppress violation — fullscreen exited because of Ctrl+R dialog
        if (isReloadKeyPressedRef.current || isUnloadingRef.current) {
          console.log('Fullscreen exited due to reload dialog — violation already counted')
          return
        }

        // Normal fullscreen exit (ESC, window minimize, etc.) - Use custom modal system
        if (!document.hidden && !isAlertOpenRef.current) {
          const newCount = countViolation('Fullscreen exit', 'user_action')
          // Custom modal is shown by countViolation function
        }

        fullscreenCheckTimeout = setTimeout(() => {
          // Don't block exam if we're waiting for cancel detection (isReloadKeyPressedRef still true)
          if (isReloadKeyPressedRef.current) return
          if (!isInFullscreen() && submissionRef.current?.status === 'in-progress' && !isSubmittingExamRef.current) {
            setIsExamBlocked(true)
            setShowResumeOverlay(true)
          }
        }, 300)
      } else {
        // Fullscreen entered
        if (isFirstFullscreenActivationRef.current) {
          setIsFirstFullscreenActivation(false)
          sessionStorage.setItem(`fullscreenEntered_${examId}`, 'true')
        }
        if (isExamBlockedRef.current) setIsExamBlocked(false)
        if (fullscreenCheckTimeout) {
          clearTimeout(fullscreenCheckTimeout)
          fullscreenCheckTimeout = null
        }
      }
    }

    // Professional Event Listener Setup - Industry Standard Approach
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (fullscreenCheckTimeout) clearTimeout(fullscreenCheckTimeout)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [examId])

  const startExam = async () => {
    try {
      setLoading(true)
      setError('')

      // Start the exam submission
      const submissionData = await submissionService.startExam(examId)

      // Update submission state
      setSubmission(submissionData.submission)

      // Fetch exam questions (secure endpoint)
      const examData = await examService.getExamForAttempt(examId)
      setExam(examData.exam)

      // Load saved answers if submission exists
      if (submissionData.submission && submissionData.submission._id) {
        try {
          const savedAnswersData = await submissionService.getSavedAnswers(submissionData.submission._id)

          // Convert saved answers array to answers object format
          const savedAnswersObj = {}
          savedAnswersData.answers.forEach(answer => {
            if (answer.selectedOption) {
              // MCQ answer
              savedAnswersObj[answer.questionId] = answer.selectedOption
            } else if (answer.codingAnswer) {
              // Coding answer (for backward compatibility)
              savedAnswersObj[answer.questionId] = answer.codingAnswer
            }
          })

          console.log('✅ Loaded', Object.keys(savedAnswersObj).length, 'saved answers')
          setAnswers(savedAnswersObj)
        } catch (err) {
          console.warn('⚠️ Failed to load saved answers:', err)
          // Continue with empty answers - not a critical error
        }
      }

      // Fetch remaining time from server (based on server time, not client time)
      const timeData = await submissionService.getRemainingTime(submissionData.submission._id)
      setRemainingTime(timeData.remainingSeconds)

      // Detect first-start vs resume-after-reload.
      // 'examStarted' is set here on first start and persists for the session.
      // On reload it will already be present, so we know it's a resume.
      const examAlreadyStarted = sessionStorage.getItem(`examStarted_${examId}`)
      if (!examAlreadyStarted) {
        // First time starting — set the flag and auto-enter fullscreen
        sessionStorage.setItem(`examStarted_${examId}`, 'true')
        requestFullscreen()
      }
      // On resume: do NOT auto-enter fullscreen.
      // The resume overlay (shown by the mount useEffect) has the manual button.
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to start exam'
      setError(errorMessage)

      // If already submitted, redirect to submissions
      if (errorMessage.includes('already submitted')) {
        setTimeout(() => {
          navigate('/candidate/submissions')
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = async (sectionIndex, questionIndex, value) => {
    const questionId = `${sectionIndex}-${questionIndex}`

    // Update local state immediately for responsive UI
    setAnswers({
      ...answers,
      [questionId]: value,
    })

    // Auto-save MCQ answer to backend (only for MCQ questions)
    if (submission && submission._id) {
      try {
        await submissionService.saveMcqAnswer(submission._id, questionId, value)
        console.log(`✅ Auto-saved MCQ answer for question ${questionId}`)
      } catch (err) {
        console.warn(`⚠️ Failed to auto-save MCQ answer for question ${questionId}:`, err)
        // Don't show error to user - auto-save should be silent
        // The answer is still stored in local state
      }
    }
  }

  const handleLanguageChange = (sectionIndex, questionIndex, language) => {
    const questionId = `${sectionIndex}-${questionIndex}`

    // Update the language
    setCodingLanguages({
      ...codingLanguages,
      [questionId]: language,
    })

    // Update the editor content with language-specific starter code
    // Only if the current answer is empty or matches a starter template
    const currentAnswer = answers[questionId]
    const currentLanguage = codingLanguages[questionId] || 'python'
    const currentTemplate = getDefaultStarterCode(currentLanguage)

    // If current answer is empty or matches the old template, replace with new template
    if (!currentAnswer || currentAnswer.trim() === '' || currentAnswer === currentTemplate) {
      setAnswers({
        ...answers,
        [questionId]: getDefaultStarterCode(language),
      })
    }
  }

  const getDefaultStarterCode = (language) => {
    const templates = {
      python: 'def solution(input):\n    # Write your code here\n    return input\n',
      javascript: 'function solution(input) {\n    // Write your code here\n    return input;\n}\n',
      c: 'char* solution(const char* input) {\n    // Write your code here\n    // Note: Return a string\n    return (char*)input;\n}\n',
      cpp: 'string solution(string input) {\n    // Write your code here\n    return input;\n}\n',
      java: 'public static String solution(String input) {\n    // Write your code here\n    return input;\n}\n'
    }
    return templates[language] || '// Write your code here\n'
  }

  const handleSubmitCode = async (sectionIndex, questionIndex) => {
    const questionId = `${sectionIndex}-${questionIndex}`
    const code = answers[questionId]
    const language = codingLanguages[questionId] || 'python'
    const executed = codeOutputs[questionId] ? true : false

    // if (!code || !code.trim()) {
    //   setCodeSaving({ ...codeSaving, [questionId]: 'saved' })
    //   return
    // }
    if (!code || !code.trim()) {
      setShowWriteCodeModal(true)
      return
    }

    if (!submission || !submission._id) {
      setCodeSaving({ ...codeSaving, [questionId]: 'saved' })
      return
    }

    // Set saving state
    setCodeSaving({ ...codeSaving, [questionId]: true })

    try {
      await submissionService.saveCodingAnswer(
        submission._id,
        questionId,
        language,
        code,
        executed
      )
      setCodeSaving(prev => ({ ...prev, [questionId]: 'saved' }))
      setTimeout(() => setCodeSaving(prev => ({ ...prev, [questionId]: false })), 3000)
    } catch (err) {
      setCodeSaving({ ...codeSaving, [questionId]: 'saved' })
    }
    // } finally {
    //   setCodeSaving({ ...codeSaving, [questionId]: false })
    // }
  }

  const handleRunCode = async (sectionIndex, questionIndex) => {
    const questionId = `${sectionIndex}-${questionIndex}`
    const code = answers[questionId]
    const language = codingLanguages[questionId] || 'python'
    const question = exam.sections[sectionIndex].questions[questionIndex]

    if (!code || !code.trim()) {
      showCodeAlert()
      return
    }

    // Set running state
    setCodeRunning({ ...codeRunning, [questionId]: true })
    setCodeOutputs({ ...codeOutputs, [questionId]: { output: '', error: '', loading: true } })

    try {
      // Check if question has test cases
      if (question.testCases && question.testCases.length > 0) {
        // Run with test cases
        const result = await codeExecutionService.runWithTestCases(language, code, question.testCases)

        setCodeOutputs({
          ...codeOutputs,
          [questionId]: {
            testResults: result.results || [],
            passed: result.passed || 0,
            total: result.total || 0,
            executionTime: result.executionTime,
            error: result.error || '',
            loading: false,
          },
        })
      } else {
        // Run without test cases (legacy mode)
        const result = await codeExecutionService.runCode(language, code, '')

        setCodeOutputs({
          ...codeOutputs,
          [questionId]: {
            output: result.output || '',
            error: result.error || '',
            executionTime: result.executionTime,
            loading: false,
          },
        })
      }
    } catch (err) {
      setCodeOutputs({
        ...codeOutputs,
        [questionId]: {
          output: '',
          error: err.response?.data?.message || 'Failed to execute code. Please try again.',
          loading: false,
        },
      })
    } finally {
      setCodeRunning({ ...codeRunning, [questionId]: false })
    }
  }

  const performExamSubmission = async () => {
    // Auto-save all coding answers before submission
    const codingQuestions = []

    // Collect all coding questions with answers
    exam.sections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        if (question.type === 'coding') {
          const questionId = `${sectionIndex}-${questionIndex}`
          const code = answers[questionId]

          // Only save if there's code written
          if (code && code.trim() !== '') {
            codingQuestions.push({
              questionId,
              code,
              language: codingLanguages[questionId] || 'python',
              executed: codeOutputs[questionId] ? true : false
            })
          }
        }
      })
    })

    // Save all coding answers before submitting exam
    if (codingQuestions.length > 0) {
      console.log(`Auto-saving ${codingQuestions.length} coding answer(s) before submission...`)

      for (const codingQ of codingQuestions) {
        try {
          await submissionService.saveCodingAnswer(
            submission._id,
            codingQ.questionId,
            codingQ.language,
            codingQ.code,
            codingQ.executed
          )
          console.log(`✓ Saved coding answer for question ${codingQ.questionId}`)
        } catch (saveErr) {
          console.warn(`Warning: Failed to save coding answer for question ${codingQ.questionId}:`, saveErr)
          // Continue with other saves even if one fails
        }
      }

      console.log('All coding answers auto-saved successfully')
    }

    // Convert answers object to array format
    // Differentiate between MCQ and coding answers
    const answersArray = Object.entries(answers).map(([questionId, value]) => {
      // Parse questionId to get section and question index
      const [sectionIndex, questionIndex] = questionId.split('-').map(Number)
      const question = exam.sections[sectionIndex]?.questions[questionIndex]

      // Check question type and format answer accordingly
      if (question?.type === 'coding') {
        return {
          questionId,
          codingAnswer: value,
          language: codingLanguages[questionId] || 'python', // Include language
        }
      } else {
        return {
          questionId,
          selectedOption: value,
        }
      }
    })

    const result = await submissionService.submitExam(submission._id, answersArray)

    // Exit fullscreen before navigation
    exitFullscreen()

    // Clear the active submission ID from storage
    sessionStorage.removeItem('activeSubmissionId')

    // Clear fullscreen tracking for this exam
    sessionStorage.removeItem(`fullscreenEntered_${examId}`)
    sessionStorage.removeItem(`examPageLoaded_${examId}`)
    sessionStorage.removeItem(`examStarted_${examId}`)
    sessionStorage.removeItem(`reloadViolation_${examId}`)

    // Clear violations for this exam
    localStorage.removeItem(`violations_${examId}`)

    navigate(`/candidate/result/${submission._id}`)
  }

  const handleSubmit = () => {
    // Open custom modal — does NOT use window.confirm() so fullscreen is never broken
    setShowSubmitModal(true)
  }

  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false)
    setIsSubmittingExam(true)
    setSubmitting(true)
    try {
      await performExamSubmission()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam')
      setSubmitting(false)
      setIsSubmittingExam(false)
    }
  }

  const handleCancelSubmit = () => {
    setShowSubmitModal(false)
    // No violation, no fullscreen change, exam continues normally
  }

  const handleTimeUp = () => {
    // Time up — submit directly without confirmation
    setIsSubmittingExam(true)
    setSubmitting(true)
    performExamSubmission().catch(err => {
      setError(err.response?.data?.message || 'Failed to submit exam')
      setSubmitting(false)
      setIsSubmittingExam(false)
    })
  }

  // Navigation functions - Enhanced for empty sections
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Move to previous question in same section
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (currentSection > 0) {
      // Move to previous section
      const prevSection = currentSection - 1
      const prevSectionQuestions = exam.sections[prevSection].questions.length
      setCurrentSection(prevSection)
      setCurrentQuestionIndex(prevSectionQuestions > 0 ? prevSectionQuestions - 1 : 0)
    }
  }

  const handleNext = () => {
    const currentSectionData = exam.sections[currentSection]
    const totalQuestionsInSection = currentSectionData.questions.length

    if (totalQuestionsInSection === 0) {
      // Empty section - move directly to next section
      if (currentSection < exam.sections.length - 1) {
        setCurrentSection(currentSection + 1)
        setCurrentQuestionIndex(0)
      }
      return
    }

    if (currentQuestionIndex < totalQuestionsInSection - 1) {
      // Move to next question in same section
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Last question in section - check if there are unanswered questions
      const unansweredCount = getUnansweredCount(currentSection)

      if (unansweredCount > 0) {
        setPendingSectionIndex(currentSection + 1)
        setShowSectionWarningModal(true)
        return
      }
      // Move to next section
      if (currentSection < exam.sections.length - 1) {
        setCurrentSection(currentSection + 1)
        setCurrentQuestionIndex(0)
      }
    }
  }

  // Check if we can navigate to previous
  const canNavigatePrevious = () => {
    return currentQuestionIndex > 0 || currentSection > 0
  }

  // Check if we can navigate to next
  const canNavigateNext = () => {
    const currentSectionData = exam.sections[currentSection]
    const totalQuestionsInSection = currentSectionData.questions.length
    
    // If empty section, can navigate if not last section
    if (totalQuestionsInSection === 0) {
      return currentSection < exam.sections.length - 1
    }
    
    // If has questions, can navigate if not last question of last section
    return !(currentQuestionIndex === totalQuestionsInSection - 1 && currentSection === exam.sections.length - 1)
  }

  // Get navigation button text
  const getNextButtonText = () => {
    const currentSectionData = exam.sections[currentSection]
    const totalQuestionsInSection = currentSectionData.questions.length
    
    // If empty section
    if (totalQuestionsInSection === 0) {
      if (currentSection < exam.sections.length - 1) {
        return `Next Section (${exam.sections[currentSection + 1].title}) →`
      }
      return 'Next →'
    }
    
    // If last question in section and not last section
    if (currentQuestionIndex === totalQuestionsInSection - 1 && currentSection < exam.sections.length - 1) {
      return `Next Section (${exam.sections[currentSection + 1].title}) →`
    }
    
    return 'Next →'
  }

  const getUnansweredCount = (sectionIndex) => {
    const section = exam.sections[sectionIndex]
    let unanswered = 0

    section.questions.forEach((question, questionIndex) => {
      const questionId = `${sectionIndex}-${questionIndex}`
      if (!answers[questionId] || answers[questionId].trim() === '') {
        unanswered++
      }
    })

    return unanswered
  }

  const getAttemptedCount = (sectionIndex) => {
    const section = exam.sections[sectionIndex]
    let attempted = 0

    section.questions.forEach((question, questionIndex) => {
      const questionId = `${sectionIndex}-${questionIndex}`
      if (answers[questionId] && answers[questionId].trim() !== '') {
        attempted++
      }
    })

    return attempted
  }

  // const handleSectionChange = (newSectionIndex) => {
  //   if (newSectionIndex === currentSection) return

  //   // Check for unanswered questions in current section
  //   const unansweredCount = getUnansweredCount(currentSection)

  //   if (unansweredCount > 0) {
  //     isConfirmDialogOpenRef.current = true
  //     const confirmed = window.confirm(
  //       `You have not attempted ${unansweredCount} question(s) in the current section. Are you sure you want to switch sections?`
  //     )
  //     isConfirmDialogOpenRef.current = false
  //     if (!confirmed) {
  //       setTimeout(() => requestFullscreen(), 200)
  //       return
  //     }
  //   }

  //   setCurrentSection(newSectionIndex)
  //   setCurrentQuestionIndex(0)
  // }
  const handleSectionChange = (newSectionIndex) => {
    if (newSectionIndex === currentSection) return

    const unansweredCount = getUnansweredCount(currentSection)

    if (unansweredCount > 0) {
      setPendingSectionIndex(newSectionIndex)
      setShowSectionWarningModal(true)
      return
    }

    setCurrentSection(newSectionIndex)
    setCurrentQuestionIndex(0)
  }
  if (loading) {
    return (
      <div>
        <div className="container">
          <div className="loading">Loading exam...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="container">
          <div className="error-message" style={{ whiteSpace: 'pre-line' }}>{error}</div>
          <button onClick={() => navigate('/candidate/exams')} className="btn btn-secondary">
            Back to Exams
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        filter: isExamBlocked ? 'blur(5px)' : 'none',
        pointerEvents: isExamBlocked ? 'none' : 'auto',
        transition: 'filter 0.3s ease'
      }}>
        <Timer remainingSeconds={remainingTime} onTimeUp={handleTimeUp} />

        {/* Violation Counter Display */}
        {submission && submission.status === 'in-progress' && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: getViolationCount() > 2 ? '#ffebee' : '#f5f5f5',
            border: `2px solid ${getViolationCount() > 2 ? '#f44336' : '#ddd'}`,
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: getViolationCount() > 2 ? '#d32f2f' : '#666',
            zIndex: 999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            ⚠️ Violations: {getViolationCount()}/3
          </div>
        )}
      </div>

      <div className="container" style={{ paddingTop: '20px', paddingBottom: '100px' }}>
        {/* Exam Blocked Overlay */}
        {isExamBlocked && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            pointerEvents: 'all'
          }} />
        )}

        <div style={{
          filter: isExamBlocked ? 'blur(5px)' : 'none',
          pointerEvents: isExamBlocked ? 'none' : 'auto',
          transition: 'filter 0.3s ease'
        }}>
          <div className="page-header">
            <div>
              <h1>{exam.title}</h1>
              <p>{exam.description}</p>
              <p style={{ color: '#7f8c8d', fontSize: '14px', marginTop: '8px' }}>
                ⏱️ Duration: {exam.duration} minutes
              </p>
            </div>
          </div>

          {/* Section Navigation */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '24px',
            borderBottom: '2px solid #ecf0f1',
            paddingBottom: '10px'
          }}>
            {exam.sections.map((section, index) => (
              <button
                key={index}
                onClick={() => handleSectionChange(index)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderBottom: currentSection === index ? '3px solid #3498db' : '3px solid transparent',
                  background: currentSection === index ? '#ecf0f1' : 'transparent',
                  cursor: 'pointer',
                  fontWeight: currentSection === index ? 'bold' : 'normal',
                  color: currentSection === index ? '#2c3e50' : '#7f8c8d',
                  transition: 'all 0.3s ease'
                }}
              >
                {section.title}
              </button>
            ))}
          </div>

          {/* Current Section Questions */}
          {exam.sections[currentSection] && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>
                  {exam.sections[currentSection].title}
                </h2>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#3498db',
                  backgroundColor: '#ecf0f1',
                  padding: '8px 16px',
                  borderRadius: '20px'
                }}>
                  Attempted: {getAttemptedCount(currentSection)} / {exam.sections[currentSection].questions.length}
                </div>
              </div>

              {exam.sections[currentSection].questions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '2px dashed #dee2e6',
                  margin: '20px 0'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', color: '#6c757d' }}>
                    📝
                  </div>
                  <h3 style={{ color: '#495057', marginBottom: '12px' }}>
                    No Questions in This Section
                  </h3>
                  <p style={{ color: '#6c757d', fontSize: '16px', marginBottom: '20px' }}>
                    This section doesn't contain any questions at the moment.
                  </p>
                  <p style={{ color: '#6c757d', fontSize: '14px' }}>
                    Use the navigation buttons below to move to other sections.
                  </p>
                </div>
              ) : (
                <>
                  {/* Single Question Display */}
                  {(() => {
                    const question = exam.sections[currentSection].questions[currentQuestionIndex]
                    const questionId = `${currentSection}-${currentQuestionIndex}`

                    return (
                      <div className="question-container">
                        <div className="question-header">
                          <span className="question-number">
                            Question {currentQuestionIndex + 1} of {exam.sections[currentSection].questions.length}
                          </span>
                          <span className="question-marks">{question.marks} marks</span>
                        </div>

                        <div className="question-text">{question.question}</div>

                        {question.type === 'mcq' && (
                          <div className="options-list">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={`option-item ${answers[questionId] === option ? 'selected' : ''
                                  }`}
                                onClick={() =>
                                  handleAnswerChange(currentSection, currentQuestionIndex, option)
                                }
                              >
                                <input
                                  type="radio"
                                  name={questionId}
                                  value={option}
                                  checked={answers[questionId] === option}
                                  onChange={(e) =>
                                    handleAnswerChange(currentSection, currentQuestionIndex, e.target.value)
                                  }
                                />
                                <label>{option}</label>
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === 'coding' && (
                          <div style={{ marginTop: '16px' }}>
                            <div style={{
                              backgroundColor: '#f8f9fa',
                              padding: '16px',
                              borderRadius: '8px',
                              marginBottom: '16px'
                            }}>
                              <h4 style={{ marginTop: 0, color: '#2c3e50' }}>
                                {question.title || 'Coding Problem'}
                              </h4>
                              {question.difficulty && (
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  backgroundColor: question.difficulty === 'Easy' ? '#d4edda' : '#fff3cd',
                                  color: question.difficulty === 'Easy' ? '#155724' : '#856404',
                                  marginBottom: '12px'
                                }}>
                                  {question.difficulty}
                                </span>
                              )}
                              <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                                {question.description || question.question}
                              </p>
                            </div>

                            {question.testCases && question.testCases.length > 0 && (
                              <div style={{ marginBottom: '16px' }}>
                                <strong style={{ display: 'block', marginBottom: '8px' }}>
                                  Example Test Cases:
                                </strong>
                                {question.testCases.slice(0, 2).map((testCase, idx) => (
                                  <div key={idx} style={{
                                    backgroundColor: '#f8f9fa',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    marginBottom: '8px',
                                    fontFamily: 'monospace',
                                    fontSize: '13px'
                                  }}>
                                    <div><strong>Input:</strong> {testCase.input}</div>
                                    <div><strong>Output:</strong> {testCase.expectedOutput}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                Programming Language:
                              </label>
                              <select
                                value={codingLanguages[questionId] || 'python'}
                                onChange={(e) => handleLanguageChange(currentSection, currentQuestionIndex, e.target.value)}
                                style={{
                                  padding: '8px 12px',
                                  fontSize: '14px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  backgroundColor: '#fff',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="python">Python</option>
                                <option value="javascript">JavaScript</option>
                                <option value="c">C</option>
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                              </select>
                            </div>

                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                              Your Code:
                            </label>
                            <div style={{
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              marginBottom: '12px'
                            }}>
                              <Editor
                                height="400px"
                                language={codingLanguages[questionId] || 'python'}
                                value={answers[questionId] || question.starterCode || getDefaultStarterCode(codingLanguages[questionId] || 'python')}
                                onChange={(value) => handleAnswerChange(currentSection, currentQuestionIndex, value)}
                                theme="vs-light"
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 14,
                                  lineNumbers: 'on',
                                  scrollBeyondLastLine: false,
                                  automaticLayout: true,
                                  tabSize: 2,
                                  wordWrap: 'on'
                                }}
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', marginBottom: '16px' }}>
                              <button
                                onClick={() => handleSubmitCode(currentSection, currentQuestionIndex)}
                                className="btn btn-success"
                                disabled={codeSaving[questionId]}
                                style={{
                                  padding: '10px 20px',
                                  fontSize: '14px',
                                  opacity: codeSaving[questionId] ? 0.6 : 1,
                                  cursor: codeSaving[questionId] ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {codeSaving[questionId] === true ? '💾 Saving...' : codeSaving[questionId] === 'saved' ? '✅ Saved!' : codeSaving[questionId] === 'error' ? '❌ Failed' : '💾 Save Code'}
                              </button>
                            </div>

                            <p style={{ color: '#7f8c8d', fontSize: '12px', marginTop: '12px' }}>
                              Note: Click "Save Code" to save your progress.
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </>
              )}

              {/* Navigation Buttons - Always visible */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '2px solid #ecf0f1'
              }}>
                <button
                  onClick={handlePrevious}
                  className="btn btn-secondary"
                  disabled={!canNavigatePrevious()}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    opacity: !canNavigatePrevious() ? 0.5 : 1,
                    cursor: !canNavigatePrevious() ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Previous
                </button>

                <button
                  onClick={handleNext}
                  className="btn btn-primary"
                  disabled={!canNavigateNext()}
                  style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    opacity: !canNavigateNext() ? 0.5 : 1,
                    cursor: !canNavigateNext() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {getNextButtonText()}
                </button>
              </div>
            </div>
          )}
        </div> {/* End blur wrapper */}
      </div>

      <div className="exam-actions" style={{
        filter: isExamBlocked ? 'blur(5px)' : 'none',
        pointerEvents: isExamBlocked ? 'none' : 'auto',
        transition: 'filter 0.3s ease'
      }}>
        <button
          onClick={handleSubmit}
          className="btn btn-success"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </div>

      {/* Reload Violation Warning — shown once after a page reload */}
      {reloadViolationCount > 0 && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '36px 40px',
            maxWidth: '460px',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            border: '3px solid #e74c3c'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ color: '#e74c3c', marginTop: 0, marginBottom: '12px' }}>
              Violation Warning
            </h2>
            <p style={{ color: '#333', fontSize: '16px', marginBottom: '8px', lineHeight: '1.6' }}>
              You reloaded the page during the exam.
            </p>
            <p style={{
              color: reloadViolationCount >= 3 ? '#e74c3c' : '#856404',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '24px'
            }}>
              Violations used: {reloadViolationCount} / 3
            </p>
            {reloadViolationCount < 3 ? (
              <p style={{ color: '#555', fontSize: '14px', marginBottom: '24px' }}>
                You have {3 - reloadViolationCount} violation(s) remaining. Further violations will terminate your exam.
              </p>
            ) : (
              <p style={{ color: '#e74c3c', fontSize: '14px', marginBottom: '24px', fontWeight: 'bold' }}>
                This is your final warning. One more violation will auto-submit your exam.
              </p>
            )}
            <button
              onClick={() => setReloadViolationCount(0)}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Cancel-Reload Fullscreen Restore Overlay */}
      {showCancelRestoreOverlay && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '40px',
            maxWidth: '440px',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            border: '3px solid #e74c3c'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ color: '#e74c3c', marginTop: 0, marginBottom: '12px' }}>
              Violation Warning
            </h2>
            <p style={{ color: '#333', fontSize: '15px', marginBottom: '8px' }}>
              You attempted to reload the page during the exam.
            </p>
            <p style={{
              color: reloadViolationCount >= 3 ? '#e74c3c' : '#856404',
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Violations: {reloadViolationCount} / 3
            </p>
            <p style={{ color: '#555', fontSize: '13px', marginBottom: '24px' }}>
              {reloadViolationCount < 3
                ? `You have ${3 - reloadViolationCount} violation(s) remaining before your exam is auto-submitted.`
                : 'This is your final warning. One more violation will terminate your exam.'}
            </p>
            <button
              onClick={async () => {
                // Hide overlay AFTER fullscreen is granted, not before.
                // Hiding it first causes a re-render that can interrupt the request.
                const elem = document.documentElement
                try {
                  if (elem.requestFullscreen) {
                    await elem.requestFullscreen()
                  } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen()
                  } else if (elem.mozRequestFullScreen) {
                    elem.mozRequestFullScreen()
                  } else if (elem.msRequestFullscreen) {
                    elem.msRequestFullscreen()
                  }
                } catch (err) {
                  console.warn('Fullscreen request failed:', err)
                } finally {
                  setShowCancelRestoreOverlay(false)
                }
              }}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Continue Exam in Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal — custom React modal, no window.confirm */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '40px',
            maxWidth: '440px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
            <h2 style={{ color: '#2c3e50', marginTop: 0, marginBottom: '12px' }}>
              Confirm Submission
            </h2>
            <p style={{ color: '#555', fontSize: '16px', marginBottom: '28px', lineHeight: '1.6' }}>
              Are you sure you want to submit your exam? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={handleCancelSubmit}
                style={{
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  backgroundColor: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                style={{
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  backgroundColor: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reload Warning Modal — custom modal, no browser popup, fullscreen stays intact */}
      {showReloadModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '40px',
            maxWidth: '440px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            border: '3px solid #e67e22'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ color: '#e67e22', marginTop: 0, marginBottom: '12px' }}>
              Reload Warning
            </h2>
            <p style={{ color: '#333', fontSize: '15px', marginBottom: '8px', lineHeight: '1.6' }}>
              Reloading will count as a violation.
            </p>
            <p style={{ color: '#555', fontSize: '13px', marginBottom: '28px' }}>
              Current violations: {getViolationCount()} / 3
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowReloadModal(false)}
                style={{
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  backgroundColor: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowReloadModal(false)
                  // Count exactly ONE violation for this modal-confirmed reload
                  const current = getViolationCount()
                  const newCount = current + 1
                  localStorage.setItem(`violations_${examId}`, newCount.toString())
                  sessionStorage.setItem(`reloadViolation_${examId}`, 'true')
                  console.log(`Modal reload confirmed. Violation count: ${newCount}/3`)
                  // Set flag BEFORE navigating so beforeunload returns early
                  // without calling e.preventDefault() — no browser popup, no double-count
                  isManualReloadRef.current = true
                  isManualReloadPending = true
                  window.location.replace(window.location.href)
                }}
                style={{
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Section Warning Modal — custom React modal, no window.confirm */}
      {showSectionWarningModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '8px',
            padding: '36px 40px', maxWidth: '460px', width: '90%',
            textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            border: '3px solid #f39c12'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ color: '#e67e22', marginTop: 0, marginBottom: '12px' }}>
              Unanswered Questions
            </h2>
            <p style={{ color: '#333', fontSize: '16px', marginBottom: '8px' }}>
              You have attempted <strong>{getAttemptedCount(currentSection)}</strong> out of{' '}
              <strong>{exam?.sections[currentSection]?.questions?.length}</strong> questions
              in the <strong>{exam?.sections[currentSection]?.title}</strong> section.
            </p>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Are you sure you want to leave? You can go back to attempt the remaining questions.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowSectionWarningModal(false)
                  setPendingSectionIndex(null)
                }}
                style={{
                  padding: '10px 24px', borderRadius: '6px', border: '2px solid #3498db',
                  backgroundColor: '#fff', color: '#3498db',
                  fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                ← Go Back to Attempt
              </button>
              <button
                onClick={() => {
                  setShowSectionWarningModal(false)
                  setCurrentSection(pendingSectionIndex)
                  setCurrentQuestionIndex(0)
                  setPendingSectionIndex(null)
                }}
                style={{
                  padding: '10px 24px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#e67e22', color: '#fff',
                  fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                Continue Anyway →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write Code Warning Modal */}
      {showWriteCodeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '8px',
            padding: '36px 40px', maxWidth: '400px', width: '90%',
            textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            border: '3px solid #e74c3c'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✏️</div>
            <h2 style={{ color: '#e74c3c', marginTop: 0, marginBottom: '12px' }}>
              No Code Written
            </h2>
            <p style={{ color: '#333', fontSize: '16px', marginBottom: '24px' }}>
              Please write your code before saving.
            </p>
            <button
              onClick={() => setShowWriteCodeModal(false)}
              style={{
                padding: '10px 32px', borderRadius: '6px', border: 'none',
                backgroundColor: '#3498db', color: '#fff',
                fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              OK, Go Back
            </button>
          </div>
        </div>
      )}

      {/* Resume Exam Overlay */}
      {showResumeOverlay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ color: '#2c3e50', marginTop: 0, marginBottom: '16px' }}>
              Resume Exam
            </h2>
            <p style={{ color: '#555', fontSize: '16px', marginBottom: '24px', lineHeight: '1.6' }}>
              Your exam session is still active. Click below to resume the exam in fullscreen mode.
            </p>
            <button
              onClick={handleResumeExam}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Custom Violation Modal - Replaces browser alerts */}
      {showViolationModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px',
            padding: '40px 50px', maxWidth: '500px', width: '90%',
            textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: violationModalData.type === 'terminated' ? '3px solid #e74c3c' : '3px solid #f39c12'
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
              color: violationModalData.type === 'terminated' ? '#e74c3c' : '#f39c12'
            }}>
              {violationModalData.type === 'terminated' ? '🚫' : '⚠️'}
            </div>
            
            <h2 style={{ 
              color: violationModalData.type === 'terminated' ? '#e74c3c' : '#f39c12', 
              marginTop: 0, marginBottom: '16px',
              fontSize: '24px', fontWeight: 'bold'
            }}>
              {violationModalData.title}
            </h2>
            
            <p style={{ 
              color: '#333', fontSize: '18px', marginBottom: '16px', 
              lineHeight: '1.6', fontWeight: '500'
            }}>
              {violationModalData.message}
            </p>
            
            {violationModalData.type !== 'terminated' && (
              <>
                <div style={{
                  backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px',
                  marginBottom: '24px', border: '2px solid #e9ecef'
                }}>
                  <div style={{ 
                    fontSize: '20px', fontWeight: 'bold', 
                    color: violationModalData.violationCount >= violationModalData.maxViolations ? '#e74c3c' : '#f39c12',
                    marginBottom: '8px'
                  }}>
                    Violations: {violationModalData.violationCount} / {violationModalData.maxViolations}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {violationModalData.maxViolations - violationModalData.violationCount} violation(s) remaining
                  </div>
                </div>
                
                <p style={{ 
                  color: '#666', fontSize: '14px', marginBottom: '24px',
                  fontStyle: 'italic'
                }}>
                  Further violations will result in automatic exam termination
                </p>
              </>
            )}
            
            <button
              onClick={closeViolationModal}
              style={{
                padding: '14px 32px', borderRadius: '8px', border: 'none',
                backgroundColor: violationModalData.type === 'terminated' ? '#e74c3c' : '#3498db',
                color: '#fff', fontSize: '16px', fontWeight: 'bold', 
                cursor: 'pointer', minWidth: '120px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              {violationModalData.type === 'terminated' ? 'End Exam' : 'I Understand'}
            </button>
          </div>
        </div>
      )}

      {/* Custom Offline Modal - Replaces browser alerts */}
      {showOfflineModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px',
            padding: '40px 50px', maxWidth: '450px', width: '90%',
            textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: '3px solid #e67e22'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#e67e22' }}>
              📡
            </div>
            
            <h2 style={{ 
              color: '#e67e22', marginTop: 0, marginBottom: '16px',
              fontSize: '24px', fontWeight: 'bold'
            }}>
              Connection Lost
            </h2>
            
            <p style={{ 
              color: '#333', fontSize: '18px', marginBottom: '24px', 
              lineHeight: '1.6', fontWeight: '500'
            }}>
              Internet connection lost. Please check your network to continue the exam safely.
            </p>
            
            <div style={{
              backgroundColor: '#fff3cd', padding: '12px', borderRadius: '6px',
              marginBottom: '24px', border: '1px solid #ffeaa7'
            }}>
              <p style={{ 
                color: '#856404', fontSize: '14px', margin: 0,
                fontWeight: '500'
              }}>
                Your exam progress is automatically saved. Restore connection to continue.
              </p>
            </div>
            
            <button
              onClick={closeOfflineModal}
              style={{
                padding: '14px 32px', borderRadius: '8px', border: 'none',
                backgroundColor: '#e67e22', color: '#fff',
                fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              I'll Check Connection
            </button>
          </div>
        </div>
      )}

      {/* Custom Code Error Modal - Replaces browser alerts */}
      {showCodeErrorModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px',
            padding: '36px 40px', maxWidth: '400px', width: '90%',
            textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: '3px solid #3498db'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#3498db' }}>
              💻
            </div>
            
            <h2 style={{ 
              color: '#3498db', marginTop: 0, marginBottom: '16px',
              fontSize: '22px', fontWeight: 'bold'
            }}>
              Code Required
            </h2>
            
            <p style={{ 
              color: '#333', fontSize: '16px', marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Please write your code before running the execution.
            </p>
            
            <button
              onClick={closeCodeErrorModal}
              style={{
                padding: '12px 32px', borderRadius: '8px', border: 'none',
                backgroundColor: '#3498db', color: '#fff',
                fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              OK, Got It
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamAttempt
