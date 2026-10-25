import http from './http'

export interface Student {
  id: number
  ownerId: number
  ownerName?: string
  fromLeadId?: number
  name: string
  phone: string
  gender?: 'MALE' | 'FEMALE'
  homeAddress: string
  emergencyName: string
  emergencyPhone: string
  planJoinDate: string
  studentStatus: 'WAITING' | 'ENROLLED'
  checkedInAt?: string
  createdAt: string
  updatedAt: string
}

export interface Travel {
  id?: number
  studentId?: number
  arriveDate?: string
  arriveTime?: string
  trafficType?: string
  needPickup?: boolean
  station?: string
  pickupUserId?: number
  pickupStatus?: string
  remark?: string
}

export async function listStudents() {
  const res = (await http.get('/students')) as { data: Student[] }
  return res.data
}

export async function studentDetail(id: number) {
  const res = (await http.get(`/students/${id}`)) as {
    data: {
      student: Student
      followups: { id: number; content: string; createdAt: string }[]
      travel: Travel
      bed: { label?: string; bedId?: number }
    }
  }
  return res.data
}

export async function updateStudent(id: number, payload: Partial<Student>) {
  const res = (await http.put(`/students/${id}`, payload)) as { data: Student }
  return res.data
}

export async function addStudentFollowup(id: number, content: string) {
  await http.post(`/students/${id}/followups`, { content })
}

export async function saveTravel(id: number, payload: Travel) {
  const res = (await http.put(`/students/${id}/travel`, payload)) as { data: Travel }
  return res.data
}
