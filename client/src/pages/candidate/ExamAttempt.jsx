import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import Navbar from '../../components/Navbar'
import Timer from '../../components/Timer'
import { examService } from '../../services/examService'
import { submissionService } from '../../services/submissionService'
import { codeExecutionService } from '../../services/codeExecutionService'
import './Candidate.css'

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

  // Violation tracking system
  const lastViolationTimeRef = useRef(0) // Debounce protection for violations
  const isAlertOpenRef = useRef(false) // Prevent violations while alert is active

  // Internet connectivity warning system
  const isOfflineAlertShownRef = useRef(false) // Prevent multiple offline alerts

  const getViolationCount = () => {
    const stored = localStorage.getItem(`violations_${examId}`)
    return stored ? parseInt(stored, 10) : 0
  }

  const incrementViolation = (reason) => {
    // Debounce protection: prevent multiple violations within 1 second
    const now = Date.now()
    if (now - lastViolationTimeRef.current < 1000) {
      console.log(`Violation debounced: ${reason}`)
      return getViolationCount()
    }
    
    // Prevent violations while alert is active
    if (isAlertOpenRef.current) {
      console.log(`Violation blocked during alert: ${reason}`)
      return getViolationCount()
    }
    
    lastViolationTimeRef.current = now

    const currentCount = getViolationCount()
    const newCount = currentCount + 1
    localStorage.setItem(`violations_${examId}`, newCount.toString())
    
    console.log(`Violation detected: ${reason}. Count: ${newCount}/3`)
    
    isAlertOpenRef.current = true
    if (newCount <= 3) {
      alert(`Warning: You are attempting to leave the exam. Violations: ${newCount}/3`)
    } else {
      alert('Exam terminated due to malpractice')
      handleSubmitDueToViolation()
    }
    isAlertOpenRef.current = false
    
    return newCount
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

  // Internet connectivity handlers
  const handleOffline = () => {
    if (isOfflineAlertShownRef.current) return
    isOfflineAlertShownRef.current = true
    alert('⚠️ Internet connection lost. Please check your network to continue the exam safely.')
  }

  const handleOnline = () => {
    isOfflineAlertShownRef.current = false
    console.log('Internet connection restored')
  }

  useEffect(() => {
    startExam()
  }, [examId])

  // Set session flag when component mounts (first time visiting this exam page)
  useEffect(() => {
    // Check for page reload violation BEFORE setting the flag
    const wasPageLoaded = sessionStorage.getItem(`examPageLoaded_${examId}`)
    const hasActiveSubmission = sessionStorage.getItem('activeSubmissionId')
    
    if (wasPageLoaded && hasActiveSubmission) {
      // This is a page reload during an active exam
      const violationCount = incrementViolation('Page reload')
      
      // If violations exceeded, block resume
      if (violationCount > 3) {
        setIsExamBlocked(true)
        return
      }
    }
    
    // Mark that this exam page has been loaded in this session
    // This flag persists across page refreshes within the same session
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

  // Prevent accidental page refresh during exam
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (submission && submission.status === 'in-progress') {
        e.preventDefault()
        e.returnValue = 'Your exam is in progress. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [submission])

  // Internet connectivity monitoring
  useEffect(() => {
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Check initial offline state
  useEffect(() => {
    if (!navigator.onLine && !isOfflineAlertShownRef.current) {
      isOfflineAlertShownRef.current = true
      alert('⚠️ You are currently offline. Please ensure stable internet connection.')
    }
  }, [])

  // Fullscreen enforcement during exam
  useEffect(() => {
    let fullscreenCheckTimeout = null
    let fullscreenRetryCount = 0
    const MAX_SILENT_RETRIES = 2

    const handleFullscreenChange = () => {
      // Check if we're still in the exam (not submitted)
      if (submission && submission.status === 'in-progress') {
        // Check if fullscreen was exited
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
          
          // Don't show warning if we're intentionally exiting for submission
          if (isSubmittingExam) {
            return
          }
          
          // Only track violation if not hidden and alert is not open (to avoid double counting with tab switch)
          if (!document.hidden && !isAlertOpenRef.current) {
            // Track violation for fullscreen exit
            const violationCount = incrementViolation('Fullscreen exit')
            if (violationCount > 3) {
              return // Auto-submission will be handled by incrementViolation
            }
          }
          
          // Clear any existing timeout
          if (fullscreenCheckTimeout) {
            clearTimeout(fullscreenCheckTimeout)
          }
          
          // Wait a short moment before re-requesting fullscreen
          // This allows browser dialogs to complete their lifecycle
          fullscreenCheckTimeout = setTimeout(() => {
            // Check again if we're still out of fullscreen and exam is in progress
            if (submission && submission.status === 'in-progress' && !isSubmittingExam) {
              if (!document.fullscreenElement && 
                  !document.webkitFullscreenElement && 
                  !document.mozFullScreenElement && 
                  !document.msFullscreenElement) {
                
                // If this is NOT the first fullscreen activation, show resume popup and block exam
                // (meaning fullscreen was previously entered and now exited - page refresh scenario)
                if (!isFirstFullscreenActivation) {
                  setIsExamBlocked(true)
                  setShowResumeOverlay(true)
                } else {
                  // First fullscreen exit - silently re-request fullscreen
                  // This handles browser dialogs without showing warnings
                  if (fullscreenRetryCount < MAX_SILENT_RETRIES) {
                    fullscreenRetryCount++
                    requestFullscreen()
                  } else {
                    // After multiple silent retries, show warning
                    // This catches intentional exits (ESC key, minimize, etc.)
                    fullscreenRetryCount = 0
                    requestFullscreen()
                  }
                }
              }
            }
          }, 200) // 200ms delay to handle browser dialog behavior
        } else {
          // Fullscreen was entered
          // Mark that fullscreen has been entered at least once
          if (isFirstFullscreenActivation) {
            setIsFirstFullscreenActivation(false)
            // Store in sessionStorage that fullscreen was entered for this exam
            sessionStorage.setItem(`fullscreenEntered_${examId}`, 'true')
          }
          
          // Unblock exam when fullscreen is re-entered
          if (isExamBlocked) {
            setIsExamBlocked(false)
          }
          
          // Clear any pending timeout and reset retry count
          if (fullscreenCheckTimeout) {
            clearTimeout(fullscreenCheckTimeout)
            fullscreenCheckTimeout = null
          }
          fullscreenRetryCount = 0
        }
      }
    }

    // Tab switch detection
    const handleVisibilityChange = () => {
      if (submission && submission.status === 'in-progress' && !isSubmittingExam) {
        // Only trigger violation when tab is hidden and alert is not open
        if (document.hidden && !isAlertOpenRef.current) {
          // Tab was switched away or window was minimized
          const violationCount = incrementViolation('Tab switch')
          if (violationCount > 3) {
            return // Auto-submission will be handled by incrementViolation
          }
        }
      }
    }

    // Listen for fullscreen change events
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    
    // Listen for tab switch events
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      // Clean up timeout on unmount
      if (fullscreenCheckTimeout) {
        clearTimeout(fullscreenCheckTimeout)
      }
      
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [submission, isSubmittingExam, isFirstFullscreenActivation, isExamBlocked, examId])

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
      
      // Request fullscreen mode after exam loads successfully
      requestFullscreen()
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

    if (!code || !code.trim()) {
      alert('Please write some code before submitting.')
      return
    }

    if (!submission || !submission._id) {
      alert('Submission not found. Please refresh the page.')
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
      alert('Code saved successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save code. Please try again.')
    } finally {
      setCodeSaving({ ...codeSaving, [questionId]: false })
    }
  }

  const handleRunCode = async (sectionIndex, questionIndex) => {
    const questionId = `${sectionIndex}-${questionIndex}`
    const code = answers[questionId]
    const language = codingLanguages[questionId] || 'python'
    const question = exam.sections[sectionIndex].questions[questionIndex]

    if (!code || !code.trim()) {
      alert('Please write some code before running.')
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
    
    // Clear violations for this exam
    localStorage.removeItem(`violations_${examId}`)
    
    navigate(`/candidate/result/${submission._id}`)
  }

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit your exam?')) {
      return
    }

    // Set flag to indicate intentional fullscreen exit
    setIsSubmittingExam(true)
    setSubmitting(true)

    try {
      await performExamSubmission()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam')
      setSubmitting(false)
      setIsSubmittingExam(false) // Reset flag on error
    }
  }

  const handleTimeUp = () => {
    alert('Time is up! Your exam will be submitted automatically.')
    handleSubmit()
  }

  // Navigation functions
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    const currentSectionData = exam.sections[currentSection]
    const totalQuestionsInSection = currentSectionData.questions.length

    if (currentQuestionIndex < totalQuestionsInSection - 1) {
      // Move to next question in same section
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Last question in section - check if there are unanswered questions
      const unansweredCount = getUnansweredCount(currentSection)
      
      if (unansweredCount > 0) {
        const confirmed = window.confirm(
          `You have not attempted ${unansweredCount} question(s) in this section. Are you sure you want to move to the next section?`
        )
        if (!confirmed) {
          return
        }
      }

      // Move to next section
      if (currentSection < exam.sections.length - 1) {
        setCurrentSection(currentSection + 1)
        setCurrentQuestionIndex(0)
      }
    }
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

  const handleSectionChange = (newSectionIndex) => {
    if (newSectionIndex === currentSection) return

    // Check for unanswered questions in current section
    const unansweredCount = getUnansweredCount(currentSection)
    
    if (unansweredCount > 0) {
      const confirmed = window.confirm(
        `You have not attempted ${unansweredCount} question(s) in the current section. Are you sure you want to switch sections?`
      )
      if (!confirmed) {
        return
      }
    }

    setCurrentSection(newSectionIndex)
    setCurrentQuestionIndex(0)
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="loading">Loading exam...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Navbar />
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
      <Navbar />
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
            top: '80px',
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
              <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
                No questions in this section.
              </p>
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
                              className={`option-item ${
                                answers[questionId] === option ? 'selected' : ''
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
                              {codeSaving[questionId] ? '💾 Saving...' : '💾 Save Code'}
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

                {/* Navigation Buttons */}
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
                    disabled={currentQuestionIndex === 0}
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      opacity: currentQuestionIndex === 0 ? 0.5 : 1,
                      cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ← Previous
                  </button>
                  
                  <button
                    onClick={handleNext}
                    className="btn btn-primary"
                    disabled={currentQuestionIndex === exam.sections[currentSection].questions.length - 1 && currentSection === exam.sections.length - 1}
                    style={{
                      padding: '12px 24px',
                      fontSize: '16px',
                      opacity: (currentQuestionIndex === exam.sections[currentSection].questions.length - 1 && currentSection === exam.sections.length - 1) ? 0.5 : 1,
                      cursor: (currentQuestionIndex === exam.sections[currentSection].questions.length - 1 && currentSection === exam.sections.length - 1) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {currentQuestionIndex === exam.sections[currentSection].questions.length - 1 && currentSection < exam.sections.length - 1
                      ? `Next Section (${exam.sections[currentSection + 1].title}) →`
                      : 'Next →'}
                  </button>
                </div>
              </>
            )}
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
              Resume Exam in Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamAttempt
