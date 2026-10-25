/** 怎么来：写死选项（深圳实训基地常用抵达方式） */
export const ARRIVAL_WAYS = [
  { value: 'SZ_NORTH', label: '深圳北站', needPickup: true, station: '深圳北站' },
  { value: 'SZ_STATION', label: '深圳站', needPickup: true, station: '深圳站' },
  { value: 'BUS', label: '大巴', needPickup: true, station: '大巴' },
  { value: 'FLIGHT', label: '飞机', needPickup: true, station: '机场' },
  { value: 'FAMILY', label: '家人送', needPickup: false, station: undefined },
  { value: 'DRIVE', label: '自驾', needPickup: false, station: undefined },
  { value: 'SELF', label: '自行到达', needPickup: false, station: undefined },
] as const

export type ArrivalWayValue = (typeof ARRIVAL_WAYS)[number]['value']

export const ARRIVAL_WAY_MAP: Record<string, string> = Object.fromEntries(
  ARRIVAL_WAYS.map((item) => [item.value, item.label]),
)

/** 兼容旧数据 */
const LEGACY: Record<string, string> = {
  TRAIN_1: '深圳北站',
  TRAIN_2: '深圳站',
}

export function arrivalLabel(code?: string | null) {
  if (!code) return '-'
  return ARRIVAL_WAY_MAP[code] || LEGACY[code] || code
}

export function arrivalWayOf(code?: string) {
  return ARRIVAL_WAYS.find((item) => item.value === code)
}
