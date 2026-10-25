import { Button, Card, Col, Radio, Row, Select, Space, Table, Tag, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import {
  assignBed,
  batchAssignBeds,
  listAllBeds,
  listAllBuildings,
  listAllFloors,
  listAllRooms,
  listPlaces,
  type BedRow,
  type BuildingRow,
  type FloorRow,
  type PlaceRow,
  type RoomRow,
} from '../api/dorms'
import { listStudents, type Student } from '../api/students'
import { formatBedLabel } from '../utils/bedLabel'

function bedLabel(item: BedRow) {
  return formatBedLabel(item)
}

function roomGenderText(value?: string) {
  if (value === 'MALE') return '男'
  if (value === 'FEMALE') return '女'
  return '未设'
}

function bedFitsStudent(bed: BedRow, student: Student) {
  if (!student.gender) return false
  if (bed.genderLimit === 'MALE') return student.gender === 'MALE'
  if (bed.genderLimit === 'FEMALE') return student.gender === 'FEMALE'
  return true
}

function shuffle<T>(list: T[]) {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export function BedAssignPage() {
  const [places, setPlaces] = useState<PlaceRow[]>([])
  const [buildings, setBuildings] = useState<BuildingRow[]>([])
  const [floors, setFloors] = useState<FloorRow[]>([])
  const [rooms, setRooms] = useState<RoomRow[]>([])
  const [beds, setBeds] = useState<BedRow[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [mode, setMode] = useState<'manual' | 'random'>('manual')

  const [placeId, setPlaceId] = useState<number>()
  const [buildingId, setBuildingId] = useState<number>()
  const [floorId, setFloorId] = useState<number>()
  const [roomId, setRoomId] = useState<number>()
  const [genderFilter, setGenderFilter] = useState<'MALE' | 'FEMALE'>()
  const [selectedBedId, setSelectedBedId] = useState<number>()
  const [selectedStudentId, setSelectedStudentId] = useState<number>()
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])

  async function reload() {
    setLoading(true)
    try {
      const [placeList, buildingList, floorList, roomList, bedList, studentList] = await Promise.all([
        listPlaces(),
        listAllBuildings(),
        listAllFloors(),
        listAllRooms(),
        listAllBeds(),
        listStudents(),
      ])
      setPlaces(placeList)
      setBuildings(buildingList)
      setFloors(floorList)
      setRooms(roomList)
      setBeds(bedList)
      setStudents(studentList)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const buildingOptions = useMemo(
    () => buildings.filter((item) => !placeId || item.placeId === placeId),
    [buildings, placeId],
  )
  const floorOptions = useMemo(
    () => floors.filter((item) => !buildingId || item.buildingId === buildingId),
    [floors, buildingId],
  )
  const roomOptions = useMemo(
    () =>
      rooms.filter((item) => {
        if (floorId) return item.floorId === floorId
        if (buildingId) return item.buildingId === buildingId
        if (placeId) {
          const placeName = places.find((p) => p.id === placeId)?.name
          return item.placeName === placeName
        }
        return true
      }),
    [rooms, floorId, buildingId, placeId, places],
  )

  const occupiedIds = useMemo(
    () => new Set(beds.filter((item) => item.studentId).map((item) => item.studentId!)),
    [beds],
  )

  const filteredFree = useMemo(() => {
    return beds.filter((item) => {
      if (item.status !== 'FREE') return false
      if (placeId) {
        const placeName = places.find((p) => p.id === placeId)?.name
        if (placeName && item.placeName !== placeName) return false
      }
      if (buildingId && item.buildingId !== buildingId) return false
      if (floorId && item.floorId !== floorId) return false
      if (roomId && item.roomId !== roomId) return false
      if (genderFilter && item.genderLimit !== genderFilter) return false
      return true
    })
  }, [beds, placeId, buildingId, floorId, roomId, genderFilter, places])

  const unassignedStudents = useMemo(() => {
    return students.filter((item) => {
      if (occupiedIds.has(item.id)) return false
      if (genderFilter && item.gender !== genderFilter) return false
      return true
    })
  }, [students, occupiedIds, genderFilter])

  async function handleManualAssign() {
    if (!selectedStudentId || !selectedBedId) {
      message.warning('指定分配：请各选 1 名学员和 1 个空床')
      return
    }
    const student = unassignedStudents.find((item) => item.id === selectedStudentId)
    const bed = filteredFree.find((item) => item.id === selectedBedId)
    if (!student || !bed) {
      message.warning('请重新选择学员和空床')
      return
    }
    if (!bedFitsStudent(bed, student)) {
      message.error(`该床位是${roomGenderText(bed.genderLimit)}生宿舍，与学员性别不符`)
      return
    }
    setAssigning(true)
    try {
      await assignBed(bed.id, student.id)
      message.success(`已指定：${student.name} → ${bedLabel(bed)}`)
      setSelectedBedId(undefined)
      setSelectedStudentId(undefined)
      await reload()
    } finally {
      setAssigning(false)
    }
  }

  async function handleRandomAssign() {
    const pickedStudents =
      selectedStudentIds.length > 0
        ? unassignedStudents.filter((item) => selectedStudentIds.includes(item.id))
        : unassignedStudents
    if (!pickedStudents.length) {
      message.warning('当前没有可分配学员（可先筛男生/女生楼层范围）')
      return
    }
    if (!filteredFree.length) {
      message.warning('当前筛选范围内没有空床，请先选地点/楼栋/楼层')
      return
    }

    const maleBeds = shuffle(filteredFree.filter((item) => item.genderLimit === 'MALE' || item.genderLimit === 'ANY'))
    const femaleBeds = shuffle(
      filteredFree.filter((item) => item.genderLimit === 'FEMALE' || item.genderLimit === 'ANY'),
    )
    const used = new Set<number>()
    const items: { bedId: number; studentId: number }[] = []
    const shuffledStudents = shuffle(pickedStudents)

    for (const student of shuffledStudents) {
      const pool = student.gender === 'FEMALE' ? femaleBeds : student.gender === 'MALE' ? maleBeds : filteredFree
      const bed = pool.find((item) => !used.has(item.id) && bedFitsStudent(item, student))
      if (!bed) continue
      used.add(bed.id)
      items.push({ bedId: bed.id, studentId: student.id })
    }

    if (!items.length) {
      message.error('没有匹配到合适床位（请确认房间已标男女宿舍，且学员有性别）')
      return
    }

    setAssigning(true)
    try {
      await batchAssignBeds(items)
      message.success(`随机分配成功 ${items.length} 人` + (items.length < shuffledStudents.length ? `，另有 ${shuffledStudents.length - items.length} 人空床不足未分` : ''))
      setSelectedStudentIds([])
      await reload()
    } finally {
      setAssigning(false)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="床位分配" extra={<Button onClick={() => void reload()} loading={loading}>刷新</Button>}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value)
              setSelectedBedId(undefined)
              setSelectedStudentId(undefined)
              setSelectedStudentIds([])
            }}
            options={[
              { label: '指定分配', value: 'manual' },
              { label: '随机分配', value: 'random' },
            ]}
          />
          <Space wrap>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="地点"
              style={{ width: 150 }}
              value={placeId}
              options={places.map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => {
                setPlaceId(value)
                setBuildingId(undefined)
                setFloorId(undefined)
                setRoomId(undefined)
              }}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="楼栋"
              style={{ width: 140 }}
              value={buildingId}
              options={buildingOptions.map((item) => ({ value: item.id, label: item.name }))}
              onChange={(value) => {
                setBuildingId(value)
                setFloorId(undefined)
                setRoomId(undefined)
              }}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="楼层"
              style={{ width: 110 }}
              value={floorId}
              options={floorOptions.map((item) => ({ value: item.id, label: `${item.floorNo} 层` }))}
              onChange={(value) => {
                setFloorId(value)
                setRoomId(undefined)
              }}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="房间"
              style={{ width: 120 }}
              value={roomId}
              options={roomOptions.map((item) => ({
                value: item.id,
                label: `${item.roomNo}·${roomGenderText(item.genderLimit)}`,
              }))}
              onChange={setRoomId}
            />
            <Select
              allowClear
              placeholder="宿舍性别"
              style={{ width: 120 }}
              value={genderFilter}
              options={[
                { value: 'MALE', label: '男生宿舍' },
                { value: 'FEMALE', label: '女生宿舍' },
              ]}
              onChange={setGenderFilter}
            />
            {mode === 'manual' ? (
              <Button type="primary" loading={assigning} onClick={() => void handleManualAssign()}>
                指定分配到所选床
              </Button>
            ) : (
              <Button type="primary" loading={assigning} onClick={() => void handleRandomAssign()}>
                随机分配到当前范围
              </Button>
            )}
          </Space>
          <div style={{ color: '#666' }}>
            {mode === 'manual'
              ? '指定：先筛楼层/房间，右侧点 1 名学员，左侧点 1 个空床，再点「指定分配」。'
              : '随机：先筛到目标楼层（可再筛男生/女生宿舍），勾选学员或全选当前列表，系统按性别匹配空床随机入住。'}
          </div>
        </Space>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title={`空闲床位（${filteredFree.length}）`} size="small">
            <Table
              size="small"
              rowKey="id"
              loading={loading}
              dataSource={filteredFree}
              pagination={{ pageSize: 8 }}
              rowSelection={
                mode === 'manual'
                  ? {
                      type: 'radio',
                      selectedRowKeys: selectedBedId ? [selectedBedId] : [],
                      onChange: (keys) => setSelectedBedId(keys[0] ? Number(keys[0]) : undefined),
                    }
                  : undefined
              }
              columns={[
                {
                  title: '位置',
                  ellipsis: true,
                  render: (_, row) => bedLabel(row),
                },
                {
                  title: '宿舍',
                  width: 80,
                  render: (_, row) => (
                    <Tag color={row.genderLimit === 'MALE' ? 'blue' : row.genderLimit === 'FEMALE' ? 'magenta' : 'default'}>
                      {roomGenderText(row.genderLimit)}
                    </Tag>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={`待分床学员（${unassignedStudents.length}）`} size="small">
            <Table
              size="small"
              rowKey="id"
              loading={loading}
              dataSource={unassignedStudents}
              pagination={{ pageSize: 8 }}
              rowSelection={
                mode === 'manual'
                  ? {
                      type: 'radio',
                      selectedRowKeys: selectedStudentId ? [selectedStudentId] : [],
                      onChange: (keys) => setSelectedStudentId(keys[0] ? Number(keys[0]) : undefined),
                    }
                  : {
                      selectedRowKeys: selectedStudentIds,
                      onChange: (keys) => setSelectedStudentIds(keys.map(Number)),
                    }
              }
              columns={[
                { title: '姓名', dataIndex: 'name', width: 90 },
                {
                  title: '性别',
                  dataIndex: 'gender',
                  width: 60,
                  render: (value) =>
                    value === 'MALE' ? <Tag color="blue">男</Tag> : value === 'FEMALE' ? <Tag color="magenta">女</Tag> : '-',
                },
                { title: '电话', dataIndex: 'phone', width: 120 },
                { title: '计划入学', dataIndex: 'planJoinDate', width: 110 },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
