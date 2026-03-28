import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { submissionService } from '../../services/submissionService'
import './Admin.css'

const CodingReview = () => {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState(null)
  const [exam, setExam] = useState(null)
  const [codingQuestions, setCodingQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCodingSubmission()
  }, [submissionId])

  const fetchCodingSubmission = async () => {
    try {
      const data = await submissionService.getSubmissionById(submissionId)
      console.log('=== CODING REVIEW DEBUG ===')
      console.log('Full submission data:', data)
      console.log('Submission answers:', data.answers)
      console.log('Exam sections:', data.examId?.sections)
      
      setSubmission(data)
      
      // Extract coding questions from exam
      if (data.examId && data.examId.sections) {
        const coding = []
        
        data.examId.sections.forEach((section, sectionIndex) => {
          console.log(`Section ${sectionIndex}: "${section.title}"`)
          
          // Only look in the "Coding" section (case-sensitive)
          if (section.title === 'Coding') {
            console.log('✓ Found Coding section!')
            console.log('Questions in Coding section:', section.questions)
            
            section.questions.forEach((question, questionIndex) => {
              console.log(`  Question ${questionIndex}:`, question.type, question.title || question.question)
              
              if (question.type === 'coding') {
                const questionId = `${sectionIndex}-${questionIndex}`
                console.log(`  Looking for answer with questionId: "${questionId}"`)
                
                // Find the answer in submission.answers array
                const answer = data.answers.find(a => {
                  console.log(`    Checking answer questionId: "${a.questionId}" (type: ${typeof a.questionId})`)
                  console.log(`    Comparing with: "${questionId}" (type: ${typeof questionId})`)
                  console.log(`    Match: ${a.questionId === questionId}`)
                  return a.questionId === questionId
                })
                
                console.log(`  Answer found:`, answer ? 'YES' : 'NO')
                if (answer) {
                  console.log(`  Answer details:`, {
                    questionId: answer.questionId,
                    type: answer.type,
                    hasSelectedOption: !!answer.selectedOption,
                    selectedOptionLength: answer.selectedOption?.length,
                    selectedOptionPreview: answer.selectedOption?.substring(0, 100),
                    language: answer.language,
                    fullAnswer: answer
                  })
                } else {
                  console.log(`  ❌ NO ANSWER FOUND for questionId: "${questionId}"`)
                  console.log(`  Available answer questionIds:`, data.answers.map(a => a.questionId))
                }
                
                coding.push({
                  questionId,
                  sectionIndex,
                  questionIndex,
                  question,
                  answer: answer || null
                })
              }
            })
          }
        })
        
        console.log('Total coding questions found:', coding.length)
        console.log('Coding questions array:', coding)
        console.log('=== END DEBUG ===')
        
        setCodingQuestions(coding)
        setExam(data.examId)
      }
    } catch (err) {
      console.error('Error fetching submission:', err)
      setError(err.response?.data?.message || 'Failed to fetch submission')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="loading">Loading coding submission...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="error-message">{error}</div>
          <button onClick={() => navigate('/admin/submissions')} className="btn btn-secondary">
            Back to Submissions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>Coding Review</h1>
          <button onClick={() => navigate('/admin/submissions')} className="btn btn-secondary">
            Back to Submissions
          </button>
        </div>

        {/* Candidate and Exam Info */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#2c3e50' }}>Submission Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <strong>Candidate:</strong> {submission.userId?.name || 'N/A'}
            </div>
            <div>
              <strong>Email:</strong> {submission.userId?.email || 'N/A'}
            </div>
            <div>
              <strong>Exam:</strong> {exam?.title || 'N/A'}
            </div>
            <div>
              <strong>Submitted At:</strong> {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Coding Questions */}
        {codingQuestions.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
              No coding questions in this exam.
            </p>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              Coding Questions ({codingQuestions.length})
            </h2>
            
            {codingQuestions.map((item, index) => (
              <div key={item.questionId} className="card" style={{ marginBottom: '20px' }}>
                {/* Question Header */}
                <div style={{ 
                  borderBottom: '2px solid #ecf0f1', 
                  paddingBottom: '12px', 
                  marginBottom: '16px' 
                }}>
                  <h3 style={{ margin: 0, color: '#2c3e50' }}>
                    Question {index + 1}
                    {item.question.title && `: ${item.question.title}`}
                  </h3>
                  {item.question.difficulty && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: item.question.difficulty === 'Easy' ? '#d4edda' : item.question.difficulty === 'Medium' ? '#fff3cd' : '#f8d7da',
                      color: item.question.difficulty === 'Easy' ? '#155724' : item.question.difficulty === 'Medium' ? '#856404' : '#721c24',
                    }}>
                      {item.question.difficulty}
                    </span>
                  )}
                </div>

                {/* Question Description */}
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>
                    Problem Description:
                  </strong>
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '12px', 
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit'
                  }}>
                    {item.question.description || item.question.question}
                  </div>
                </div>

                {/* Candidate's Answer */}
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', color: '#2c3e50' }}>
                    Candidate's Code:
                  </strong>
                  
                  {item.answer && (item.answer.codingAnswer || item.answer.selectedOption || item.answer.code) ? (
                    <div>
                      {/* Language Badge */}
                      {item.answer.language && (
                        <div style={{ marginBottom: '8px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                          }}>
                            Language: {item.answer.language.toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Code Display */}
                      <pre style={{
                        backgroundColor: '#2c3e50',
                        color: '#ecf0f1',
                        padding: '16px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        margin: 0,
                        maxHeight: '400px'
                      }}>
                        <code>{item.answer.codingAnswer || item.answer.selectedOption || item.answer.code}</code>
                      </pre>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffc107',
                      padding: '12px',
                      borderRadius: '4px',
                      color: '#856404',
                      fontStyle: 'italic'
                    }}>
                      No code submitted for this question
                    </div>
                  )}
                </div>

                {/* Submission Status */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}>
                  <strong style={{ color: '#2c3e50' }}>Submission Status: </strong>
                  {item.answer && (item.answer.codingAnswer || item.answer.selectedOption || item.answer.code) ? (
                    <span style={{ color: '#28a745', fontWeight: '600' }}>
                      ✓ Submitted
                    </span>
                  ) : (
                    <span style={{ color: '#dc3545', fontWeight: '600' }}>
                      ✗ Not Submitted
                    </span>
                  )}
                </div>

                {/* Marks Section (for admin reference) */}
                {item.question.marks && (
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    backgroundColor: '#e3f2fd',
                    borderRadius: '4px',
                    border: '1px solid #2196f3'
                  }}>
                    <strong style={{ color: '#1976d2' }}>
                      Question Marks: {item.question.marks}
                    </strong>
                    <div style={{ fontSize: '13px', color: '#1976d2', marginTop: '4px' }}>
                      Note: Please review the code and assign marks manually
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {codingQuestions.length > 0 && (
          <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#2c3e50' }}>Summary</h3>
            <div style={{ fontSize: '16px', color: '#495057' }}>
              <strong>Total Coding Questions:</strong> {codingQuestions.length}
              <br />
              <strong>Submitted:</strong> {codingQuestions.filter(q => q.answer && (q.answer.codingAnswer || q.answer.selectedOption || q.answer.code)).length}
              <br />
              <strong>Not Submitted:</strong> {codingQuestions.filter(q => !q.answer || (!q.answer.codingAnswer && !q.answer.selectedOption && !q.answer.code)).length}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CodingReview
