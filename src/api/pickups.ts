import http from './http'

export interface PickupRow {
  id: number
  studentId: number
  studentName: string
  phone: string
  arriveDate?: string
  arriveTime?: string
  station?: string
  trafficType?: string
  pickupUserName?: string
  pickupStatus: 'WAITING' | 'PICKED'
  remark?: string
}

export async function listPickups(params?: { from?: string; to?: string; station?: string }) {
  const res = (await http.get('/pickups', { params })) as { data: PickupRow[] }
  return res.data
}

export async function markPickup(studentId: number, pickupStatus: 'WAITING' | 'PICKED') {
  await http.post(`/pickups/${studentId}/status`, { pickupStatus })
}
