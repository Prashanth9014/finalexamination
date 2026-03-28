import api from './api'

export const codeExecutionService = {
  async runCode(language, code, input = '') {
    const response = await api.post('/code/run', {
      language,
      code,
      input,
    })
    return response.data
  },

  async runWithTestCases(language, code, testCases) {
    const response = await api.post('/code/test', {
      language,
      code,
      testCases,
    })
    return response.data
  },

  async checkDockerStatus() {
    const response = await api.get('/code/docker-status')
    return response.data
  },
}
