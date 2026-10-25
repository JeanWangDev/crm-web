import http from './http'

export interface CheckinRow {
  studentId: number
  name: string
  phone: string
  gender?: 'MALE' | 'FEMALE'
  planJoinDate?: string
  studentStatus: 'WAITING' | 'ENROLLED'
  checkedInAt?: string
  ownerName?: string
  arriveDate?: string
  arriveTime?: string
  trafficType?: string
  bedLabel?: string
  bedId?: number
}

export async function listCheckins() {
  const res = (await http.get('/checkins')) as { data: CheckinRow[] }
  return res.data
}

export async function confirmCheckin(studentId: number) {
  await http.post(`/students/${studentId}/checkin`)
}

export async function cancelCheckin(studentId: number) {
  await http.post(`/students/${studentId}/checkin/cancel`)
}
