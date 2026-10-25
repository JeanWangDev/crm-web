import http from './http'

export interface Staff {
  id: number
  account: string
  name: string
  phone: string
  role: string
  enabled: boolean
}

export async function listUsers() {
  const res = (await http.get('/users')) as { data: Staff[] }
  return res.data
}

export async function createUser(payload: {
  account: string
  name: string
  phone?: string
  password: string
  role: 'ADMIN' | 'ADVISOR'
}) {
  await http.post('/users', payload)
}

export async function resetUserPassword(id: number, password: string) {
  await http.post(`/users/${id}/password`, { password })
}

export async function setUserEnabled(id: number, enabled: boolean) {
  await http.post(`/users/${id}/enabled`, { enabled })
}
