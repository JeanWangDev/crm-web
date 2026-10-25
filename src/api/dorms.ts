import http from './http'

export interface PlaceRow {
  id: number
  name: string
  address?: string
  remark?: string
  buildingCount: number
}

export interface BuildingRow {
  id: number
  placeId: number
  placeName: string
  name: string
  remark?: string
  floorCount: number
}

export interface FloorRow {
  id: number
  buildingId: number
  placeName: string
  buildingName: string
  floorNo: number
  remark?: string
  roomCount: number
}

export interface RoomRow {
  id: number
  floorId: number
  buildingId?: number
  placeName: string
  buildingName: string
  floorNo: number
  roomNo: string
  genderLimit: 'ANY' | 'MALE' | 'FEMALE'
  remark?: string
  bedCount: number
  freeCount: number
}

export interface BedRow {
  id: number
  bedNo: number
  status: 'FREE' | 'OCCUPIED'
  studentId?: number
  studentName?: string
  studentPhone?: string
  roomId?: number
  roomNo?: string
  floorId?: number
  floorNo?: number
  buildingId?: number
  buildingName?: string
  placeName?: string
  genderLimit?: 'ANY' | 'MALE' | 'FEMALE'
}

export interface BedPlace {
  bedId: number
  label: string
  bedNo?: number
  roomNo?: string
  floorNo?: number
  buildingName?: string
  campusName?: string
  genderLimit?: string
  status?: string
}

export interface OccupantRow {
  studentId: number
  studentName: string
  studentPhone?: string
  bedId: number
  bedLabel: string
}

async function get<T>(url: string) {
  const res = (await http.get(url)) as { data: T }
  return res.data
}

export const listPlaces = () => get<PlaceRow[]>('/dorms/places')
export const listAllBuildings = () => get<BuildingRow[]>('/dorms/buildings')
export const listBuildings = (placeId: number) => get<BuildingRow[]>(`/dorms/places/${placeId}/buildings`)
export const listAllFloors = () => get<FloorRow[]>('/dorms/floors')
export const listFloors = (buildingId: number) => get<FloorRow[]>(`/dorms/buildings/${buildingId}/floors`)
export const listAllRooms = () => get<RoomRow[]>('/dorms/rooms')
export const listRooms = (floorId: number) => get<RoomRow[]>(`/dorms/floors/${floorId}/rooms`)
export const listAllBeds = () => get<BedRow[]>('/dorms/beds')
export const listBeds = (roomId: number) => get<BedRow[]>(`/dorms/rooms/${roomId}/beds`)

export async function createPlace(payload: { name: string; address?: string; remark?: string }) {
  await http.post('/dorms/places', payload)
}

export async function updatePlace(id: number, payload: { name: string; address?: string; remark?: string }) {
  await http.put(`/dorms/places/${id}`, payload)
}

export async function deletePlace(id: number) {
  await http.delete(`/dorms/places/${id}`)
}

export async function placeOccupants(id: number) {
  return get<OccupantRow[]>(`/dorms/places/${id}/occupants`)
}

export async function createBuilding(placeId: number, payload: { name: string; remark?: string }) {
  await http.post(`/dorms/places/${placeId}/buildings`, payload)
}

export async function updateBuilding(id: number, payload: { name: string; remark?: string }) {
  await http.put(`/dorms/buildings/${id}`, payload)
}

export async function deleteBuilding(id: number) {
  await http.delete(`/dorms/buildings/${id}`)
}

export async function buildingOccupants(id: number) {
  return get<OccupantRow[]>(`/dorms/buildings/${id}/occupants`)
}

export async function createFloor(
  buildingId: number,
  payload: {
    floorNo: number
    roomNos?: string[]
    bedCount?: number
    remark?: string
    genderLimit?: string
  },
) {
  await http.post(`/dorms/buildings/${buildingId}/floors`, payload)
}

export async function updateFloor(id: number, payload: { floorNo: number; remark?: string }) {
  await http.put(`/dorms/floors/${id}`, payload)
}

export async function deleteFloor(id: number) {
  await http.delete(`/dorms/floors/${id}`)
}

export async function floorOccupants(id: number) {
  return get<OccupantRow[]>(`/dorms/floors/${id}/occupants`)
}

export async function createRoom(
  floorId: number,
  payload: { roomNo: string; bedCount?: number; genderLimit?: string; remark?: string },
) {
  await http.post(`/dorms/floors/${floorId}/rooms`, payload)
}

export async function updateRoom(
  id: number,
  payload: { roomNo: string; genderLimit?: string; remark?: string },
) {
  await http.put(`/dorms/rooms/${id}`, payload)
}

export async function deleteRoom(id: number) {
  await http.delete(`/dorms/rooms/${id}`)
}

export async function roomOccupants(id: number) {
  return get<OccupantRow[]>(`/dorms/rooms/${id}/occupants`)
}

export async function addBed(roomId: number) {
  await http.post(`/dorms/rooms/${roomId}/beds`)
}

export async function assignBed(bedId: number, studentId: number) {
  await http.post(`/dorms/beds/${bedId}/assign`, { studentId })
}

export async function batchAssignBeds(items: { bedId: number; studentId: number }[]) {
  await http.post('/dorms/beds/batch-assign', { items })
}

export async function releaseBed(bedId: number) {
  await http.post(`/dorms/beds/${bedId}/release`)
}

export async function freeBeds() {
  return get<BedPlace[]>('/dorms/beds/free')
}
