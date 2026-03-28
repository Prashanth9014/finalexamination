import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { examService } from '../../services/examService'
import './Admin.css'

const CreateExam = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draftId, setDraftId] = useState(null)
  const [isDraft, setIsDraft] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    language: '',
    sections: [
      {
        title: 'Aptitude',
        questions: [],
      },
      {
        title: 'Reasoning',
        questions: [],
      },
      {
        title: 'Technical',
        questions: [],
      },
      {
        title: 'Coding',
        questions: [],
      },
    ],
  })

  // Load draft exam if resuming
  useEffect(() => {
    const resumeId = searchParams.get('resume')
    if (resumeId) {
      loadDraft(resumeId)
    }
  }, [])

  // Update draft with language when it changes
  useEffect(() => {
    if (draftId && formData.language) {
      updateDraftWithLanguage()
    }
  }, [formData.language, draftId])

  const loadDraft = async (examId) => {
    try {
      setLoading(true)
      const exam = await examService.getDraftExam(examId)
      setFormData({
        title: exam.title,
        description: exam.description,
        duration: exam.duration.toString(),
        sections: exam.sections,
      })
      setDraftId(exam._id)
      setIsDraft(true)
      console.log('Draft loaded:', exam._id)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load draft')
    } finally {
      setLoading(false)
    }
  }

  const createDraft = async () => {
    try {
      const result = await examService.createDraftExam({
        title: formData.title,
        description: formData.description,
        duration: parseInt(formData.duration, 10),
      })
      
      setDraftId(result._id)
      setIsDraft(true)
      console.log('Draft created:', result._id)
      return result
    } catch (err) {
      console.error('Failed to create draft:', err)
      throw err
    }
  }

  const updateDraftWithLanguage = async () => {
    if (!draftId) return
    try {
      await examService.updateDraftExam(draftId, {
        language: formData.language,
      })
    } catch (err) {
      console.error('Failed to update draft language:', err)
    }
  }

  const saveQuestion = async (sectionIndex, questionIndex) => {
    // Validate required fields first
    if (!formData.title || !formData.description || !formData.duration) {
      alert('Please fill in exam details first (title, description, duration)')
      return
    }

    setAutoSaving(true)
    
    try {
      let currentDraftId = draftId
      
      // Create draft if it doesn't exist
      if (!currentDraftId) {
        const draft = await createDraft()
        currentDraftId = draft._id
        setDraftId(currentDraftId)
      }
      
      // Now save the question using the current draft ID
      await examService.updateDraftExam(currentDraftId, {
        sections: formData.sections,
      })
      
      alert('Question saved successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question')
    } finally {
      setAutoSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSectionChange = (sectionIndex, field, value) => {
    const newSections = [...formData.sections]
    newSections[sectionIndex][field] = value
    setFormData({ ...formData, sections: newSections })
  }

  const handleQuestionChange = (sectionIndex, questionIndex, field, value) => {
    const newSections = [...formData.sections]
    newSections[sectionIndex].questions[questionIndex][field] = value
    setFormData({ ...formData, sections: newSections })
  }

  const handleOptionChange = (sectionIndex, questionIndex, optionIndex, value) => {
    const newSections = [...formData.sections]
    newSections[sectionIndex].questions[questionIndex].options[optionIndex] = value
    setFormData({ ...formData, sections: newSections })
  }

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [
        ...formData.sections,
        {
          title: `Section ${formData.sections.length + 1}`,
          questions: [],
        },
      ],
    })
  }

  const addQuestion = (sectionIndex) => {
    const newSections = [...formData.sections]
    const sectionTitle = newSections[sectionIndex].title
    
    // Determine question type based on section
    const questionType = sectionTitle === 'Coding' ? 'coding' : 'mcq'
    
    if (questionType === 'coding') {
      // Check if already has 2 coding questions
      const codingQuestions = newSections[sectionIndex].questions
      if (codingQuestions.length >= 2) {
        alert('Coding section can only have 2 questions (1 Easy, 1 Medium)')
        return
      }
      
      // Determine difficulty based on existing questions
      const difficulty = codingQuestions.length === 0 ? 'Easy' : 'Medium'
      
      newSections[sectionIndex].questions.push({
        type: 'coding',
        title: '',
        description: '',
        difficulty: difficulty,
        starterCode: '',
        marks: difficulty === 'Easy' ? 10 : 15,
        question: '', // Keep for compatibility
      })
    } else {
      newSections[sectionIndex].questions.push({
        type: 'mcq',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        marks: 5,
      })
    }
    
    setFormData({ ...formData, sections: newSections })
  }

  const handleTestCaseChange = (sectionIndex, questionIndex, testCaseIndex, field, value) => {
    const newSections = [...formData.sections]
    newSections[sectionIndex].questions[questionIndex].testCases[testCaseIndex][field] = value
    setFormData({ ...formData, sections: newSections })
  }

  const addTestCase = (sectionIndex, questionIndex) => {
    const newSections = [...formData.sections]
    newSections[sectionIndex].questions[questionIndex].testCases.push({
      input: '',
      expectedOutput: ''
    })
    setFormData({ ...formData, sections: newSections })
  }

  const removeTestCase = (sectionIndex, questionIndex, testCaseIndex) => {
    const newSections = [...formData.sections]
    newSections[sectionIndex].questions[questionIndex].testCases.splice(testCaseIndex, 1)
    setFormData({ ...formData, sections: newSections })
  }

  const removeQuestion = (sectionIndex, questionIndex) => {
    const newSections = [...formData.sections]
    newSections[sectionIndex].questions.splice(questionIndex, 1)
    setFormData({ ...formData, sections: newSections })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (draftId) {
        // Publishing draft exam
        console.log('=== PUBLISHING DRAFT EXAM ===')
        console.log('Draft ID:', draftId)
        
        // First update with latest changes including language
        await examService.updateDraftExam(draftId, {
          sections: formData.sections,
          language: formData.language,
        })
        
        // Then publish
        await examService.publishDraftExam(draftId)
        
        console.log('Draft exam published successfully')
        console.log('=== END PUBLISH DRAFT ===')
      } else {
        // Creating new exam (old flow)
        const payload = {
          ...formData,
          duration: parseInt(formData.duration, 10),
          sections: formData.sections.map(section => ({
            ...section,
            questions: section.questions.map(question => ({
              ...question,
              marks: Number(question.marks)
            }))
          }))
        }
        
        console.log('=== CREATING EXAM ===')
        console.log('Payload:', JSON.stringify(payload, null, 2))
        
        await examService.createExam(payload)
        
        console.log('Exam created successfully')
        console.log('=== END CREATE EXAM ===')
      }
      
      navigate('/admin/exams')
    } catch (err) {
      console.error('=== CREATE/PUBLISH EXAM ERROR ===')
      console.error('Error:', err)
      console.error('Response:', err.response)
      console.error('=== END ERROR ===')
      
      setError(err.response?.data?.message || 'Failed to create/publish exam')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>
            {isDraft ? 'Resume Exam Creation' : 'Create New Exam'}
            {isDraft && (
              <span style={{
                marginLeft: '12px',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: '#fff3cd',
                color: '#856404',
              }}>
                📝 Draft
              </span>
            )}
          </h1>
          <button onClick={() => navigate('/admin')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>

        <div className="card exam-form">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Exam Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., JavaScript Fundamentals Test"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the exam"
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g., 60"
                min="1"
                max="999"
                step="1"
                required
                style={{ fontSize: '16px' }} // Prevent zoom on mobile
              />
              <small style={{ color: '#7f8c8d', display: 'block', marginTop: '4px' }}>
                Enter duration in minutes (e.g., 60 for 1 hour)
              </small>
            </div>

            <div className="form-group">
              <label>Programming Language</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                required
              >
                <option value="">Select programming language for this exam</option>
                <option value="Python">Python</option>
                <option value="Java">Java</option>
                <option value="C">C</option>
                <option value="C++">C++</option>
              </select>
            </div>

            {formData.sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <div className="section-header">
                  <h3>{section.title}</h3>
                  <button
                    type="button"
                    onClick={() => addQuestion(sectionIndex)}
                    className="btn btn-primary btn-sm"
                  >
                    + Add Question
                  </button>
                </div>

                {section.questions.length === 0 && (
                  <p style={{ color: '#7f8c8d', fontStyle: 'italic', marginBottom: '16px' }}>
                    No questions added yet. Click "Add Question" to add questions to this section.
                  </p>
                )}

                {section.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="question-card">
                    <div className="question-header">
                      <strong>Question {questionIndex + 1}</strong>
                      <div>
                        <button
                          type="button"
                          onClick={() => saveQuestion(sectionIndex, questionIndex)}
                          className="btn btn-success btn-sm"
                          disabled={autoSaving}
                          style={{ marginRight: '8px' }}
                        >
                          {autoSaving ? 'Saving...' : '💾 Save Question'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(sectionIndex, questionIndex)}
                          className="btn btn-danger btn-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Question</label>
                      <textarea
                        value={question.question}
                        onChange={(e) =>
                          handleQuestionChange(sectionIndex, questionIndex, 'question', e.target.value)
                        }
                        placeholder="Enter question"
                        rows="2"
                        required
                      />
                    </div>

                    {question.type === 'mcq' ? (
                      <>
                        <div className="form-group">
                          <label>Options</label>
                          {question.options.map((option, optionIndex) => (
                            <input
                              key={optionIndex}
                              type="text"
                              value={option}
                              onChange={(e) =>
                                handleOptionChange(sectionIndex, questionIndex, optionIndex, e.target.value)
                              }
                              placeholder={`Option ${optionIndex + 1}`}
                              style={{ marginBottom: '8px' }}
                              required
                            />
                          ))}
                        </div>

                        <div className="form-group">
                          <label>Correct Answer</label>
                          <select
                            value={question.correctAnswer}
                            onChange={(e) =>
                              handleQuestionChange(sectionIndex, questionIndex, 'correctAnswer', e.target.value)
                            }
                            required
                          >
                            <option value="">Select correct answer</option>
                            {question.options.map((option, idx) => (
                              <option key={idx} value={option}>
                                {option || `Option ${idx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : question.type === 'coding' ? (
                      <>
                        <div className="form-group">
                          <label>Difficulty</label>
                          <input
                            type="text"
                            value={question.difficulty || ''}
                            readOnly
                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                          />
                          <small style={{ color: '#7f8c8d' }}>
                            First question: Easy, Second question: Medium
                          </small>
                        </div>

                        <div className="form-group">
                          <label>Title</label>
                          <input
                            type="text"
                            value={question.title || ''}
                            onChange={(e) =>
                              handleQuestionChange(sectionIndex, questionIndex, 'title', e.target.value)
                            }
                            placeholder="e.g., Reverse a String"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Description</label>
                          <textarea
                            value={question.description || ''}
                            onChange={(e) =>
                              handleQuestionChange(sectionIndex, questionIndex, 'description', e.target.value)
                            }
                            placeholder="Detailed problem description"
                            rows="3"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Starter Code (Optional)</label>
                          <textarea
                            value={question.starterCode || ''}
                            onChange={(e) =>
                              handleQuestionChange(sectionIndex, questionIndex, 'starterCode', e.target.value)
                            }
                            placeholder="function solution() {\n  // Your code here\n}"
                            rows="4"
                            style={{ fontFamily: 'monospace' }}
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}

            <button type="button" onClick={addSection} className="btn btn-secondary" style={{ marginTop: '16px', display: 'none' }}>
              + Add Section
            </button>

            <div className="btn-group" style={{ marginTop: '32px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (isDraft ? 'Publishing...' : 'Creating...') : (isDraft ? 'Publish Exam' : 'Create Exam')}
              </button>
              <button type="button" onClick={() => navigate('/admin')} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateExam
