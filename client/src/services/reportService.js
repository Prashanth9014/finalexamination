import api from './api'

export const reportService = {
  async getProgrammingLanguageReport(language) {
    const response = await api.get('/admin/report', {
      params: { language },
    })
    return response.data
  },
  
  // Keep old method for backward compatibility
  async getDepartmentReport(department) {
    const response = await api.get('/admin/department-report', {
      params: { department },
    })
    return response.data
  },
}
