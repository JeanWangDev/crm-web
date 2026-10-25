/** 地点/楼栋/楼层/房间(N床位) */
export function formatBedLabel(parts: {
  placeName?: string | null
  buildingName?: string | null
  floorNo?: number | null
  roomNo?: string | null
  bedNo?: number | null
}) {
  const place = parts.placeName?.trim() || '-'
  const building = parts.buildingName?.trim() || '-'
  const floor = parts.floorNo == null ? '-' : `${parts.floorNo}层`
  const room = parts.roomNo?.trim() || '-'
  const bedNo = parts.bedNo ?? 0
  return `${place}/${building}/${floor}/${room}(${bedNo}床位)`
}
