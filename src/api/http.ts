import axios from 'axios'
import { message } from 'antd'

const http = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body.code === 'number' && body.code !== 0) {
      message.error(body.message || '请求失败')
      return Promise.reject(body)
    }
    return body
  },
  (error) => {
    const msg = error?.response?.data?.message || error.message || '网络错误'
    if (error?.response?.status === 401) {
      localStorage.removeItem('crm_token')
      localStorage.removeItem('crm_user')
      if (!location.pathname.includes('/login')) {
        location.href = '/login'
      }
    }
    message.error(msg)
    return Promise.reject(error)
  },
)

export default http
