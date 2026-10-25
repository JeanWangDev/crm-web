import http from './http'

export interface Lead {
  id: number
  ownerId: number
  ownerName?: string
  studentName: string
  studentPhone: string
  wechat?: string
  source?: string
  status: 'PENDING' | 'FOLLOWING' | 'DROPPED' | 'CONVERTED'
  remark?: string
  convertedStudentId?: number
  createdById?: number
  updatedById?: number
  createdByName?: string
  updatedByName?: string
  createdAt: string
  updatedAt: string
}

export interface Followup {
  id: number
  content: string
  operatorId: number
  createdAt: string
}

export type LeadFormPayload = {
  studentName: string
  studentPhone: string
  wechat?: string
  source?: string
  remark?: string
}

export async function listLeads() {
  const res = (await http.get('/leads')) as { data: Lead[] }
  return res.data
}

export async function leadDetail(id: number) {
  const res = (await http.get(`/leads/${id}`)) as { data: { lead: Lead; followups: Followup[] } }
  return res.data
}

export async function createLead(payload: LeadFormPayload) {
  const res = (await http.post('/leads', payload)) as { data: Lead }
  return res.data
}

export type LeadImportRow = {
  studentName: string
  studentPhone: string
  wechat?: string
  source?: string
  status?: string
  ownerName?: string
  remark?: string
}

export type LeadImportResult = {
  success: number
  failed: number
  errors: string[]
}

export async function importLeads(rows: LeadImportRow[]) {
  const res = (await http.post('/leads/import', rows)) as { data: LeadImportResult }
  return res.data
}

export async function updateLead(id: number, payload: LeadFormPayload) {
  const res = (await http.put(`/leads/${id}`, payload)) as { data: Lead }
  return res.data
}

export async function addLeadFollowup(id: number, content: string) {
  const res = (await http.post(`/leads/${id}/followups`, { content })) as { data: Followup }
  return res.data
}

export async function changeLeadStatus(id: number, status: Lead['status']) {
  const res = (await http.patch(`/leads/${id}/status`, { status })) as { data: Lead }
  return res.data
}

export async function convertLead(
  id: number,
  payload: {
    name?: string
    phone?: string
    gender: 'MALE' | 'FEMALE'
    homeAddress: string
    emergencyName: string
    emergencyPhone: string
    planJoinDate: string
  },
) {
  const res = (await http.post(`/leads/${id}/convert`, payload)) as { data: { id: number } }
  return res.data
}
