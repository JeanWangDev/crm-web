import axios from 'axios'
import { message } from 'antd'

// 本地开发走相对路径 /api（代理到本机）。测试环境打包后直接请求接口域名，
// 否则浏览器里看到的一直是前端域名 crm-test.aipassly.com。
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
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
