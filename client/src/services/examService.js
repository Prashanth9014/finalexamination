import api from './api'

export const examService = {
  async getAllExams(language) {
    const url = language ? `/exams?language=${encodeURIComponent(language)}` : '/exams'
    const response = await api.get(url)
    return response.data
  },

  async getExamById(id) {
    const response = await api.get(`/exams/${id}`)
    return response.data
  },

  async getExamForAttempt(id) {
    const response = await api.get(`/exams/${id}/attempt`)
    return response.data
  },

  async createExam(data) {
    const response = await api.post('/exams', data)
    return response.data
  },

  async updateExam(id, data) {
    const response = await api.put(`/exams/${id}`, data)
    return response.data
  },

  async deleteExam(id) {
    const response = await api.delete(`/exams/${id}`)
    return response.data
  },

  // Draft Exam Methods
  async createDraftExam(data) {
    const response = await api.post('/exams/draft', data)
    return response.data
  },

  async getDraftExam(id) {
    const response = await api.get(`/exams/draft/${id}`)
    return response.data
  },

  async updateDraftExam(id, data) {
    const response = await api.put(`/exams/draft/${id}`, data)
    return response.data
  },

  async publishDraftExam(id) {
    const response = await api.post(`/exams/draft/${id}/publish`)
    return response.data
  },
}
