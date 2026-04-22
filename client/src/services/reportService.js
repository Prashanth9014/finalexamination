import api from './api'

export const reportService = {
  async getProgrammingLanguageReport(language) {
    const response = await api.get('/admins/report', {
      params: { language },
    })
    return response.data
  },
  
  // Keep old method for backward compatibility
  async getDepartmentReport(department) {
    const response = await api.get('/admins/department-report', {
      params: { department },
    })
    return response.data
  },
}
