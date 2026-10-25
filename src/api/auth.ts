import http from './http'

export interface CrmUser {
  id: number
  account: string
  name: string
  phone: string
  role: 'ADVISOR' | 'ADMIN'
}

export async function login(account: string, password: string) {
  const res = (await http.post('/auth/login', { account, password })) as {
    data: { token: string; user: CrmUser }
  }
  return res.data
}

export async function fetchMe() {
  const res = (await http.get('/auth/me')) as { data: CrmUser }
  return res.data
}

export async function health() {
  return http.get('/auth/health')
}
