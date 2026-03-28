import api from './api'

export const submissionService = {
  async startExam(examId) {
    const response = await api.post(`/submissions/start/${examId}`)
    return response.data
  },

  async submitExam(submissionId, answers) {
    const response = await api.post(`/submissions/submit/${submissionId}`, {
      answers,
    })
    return response.data
  },

  async getMySubmissions() {
    const response = await api.get('/submissions/my')
    return response.data
  },

  async getAllSubmissions() {
    const response = await api.get('/submissions/all')
    return response.data
  },

  async getSubmissionById(id) {
    const response = await api.get(`/submissions/${id}`)
    return response.data
  },

  async saveCodingAnswer(submissionId, questionId, language, code, executed) {
    const response = await api.post(`/submissions/${submissionId}/save-code`, {
      questionId,
      language,
      code,
      executed,
    })
    return response.data
  },

  async saveMcqAnswer(submissionId, questionId, selectedOption) {
    const response = await api.post(`/submissions/${submissionId}/save-mcq`, {
      questionId,
      selectedOption,
    })
    return response.data
  },

  async getSavedAnswers(submissionId) {
    const response = await api.get(`/submissions/${submissionId}/saved-answers`)
    return response.data
  },

  async getRemainingTime(submissionId) {
    const response = await api.get(`/submissions/${submissionId}/remaining-time`)
    return response.data
  },

  async resetCandidateAttempt(submissionId) {
    const response = await api.post(`/submissions/${submissionId}/reset`)
    return response.data
  },
}
