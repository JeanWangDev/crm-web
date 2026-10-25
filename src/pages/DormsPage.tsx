import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { Button, Tag, message } from 'antd'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  addBed,
  assignBed,
  buildingOccupants,
  createBuilding,
  createFloor,
  createPlace,
  createRoom,
  deleteBuilding,
  deleteFloor,
  deletePlace,
  deleteRoom,
  floorOccupants,
  listAllBeds,
  listAllBuildings,
  listAllFloors,
  listAllRooms,
  listBuildings,
  listFloors,
  listPlaces,
  placeOccupants,
  releaseBed,
  roomOccupants,
  updateBuilding,
  updateFloor,
  updatePlace,
  updateRoom,
  type BedRow,
  type BuildingRow,
  type FloorRow,
  type PlaceRow,
  type RoomRow,
} from '../api/dorms'
import { listStudents } from '../api/students'
import { confirmDormDelete } from '../utils/dormDelete'

const GENDER: Record<string, string> = { ANY: '未设', MALE: '男生宿舍', FEMALE: '女生宿舍' }
const ROOM_GENDER_OPTIONS = [
  { value: 'MALE', label: '男生宿舍' },
  { value: 'FEMALE', label: '女生宿舍' },
]

function reload(actionRef: { current?: ActionType | null }) {
  actionRef.current?.reload()
}

function roomNumbers(text: unknown) {
  return String(text || '')
    .split(/[,，、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const selectFieldProps = { showSearch: true, allowClear: true, optionFilterProp: 'label' as const }

function placeOptions() {
  return listPlaces().then((list) => list.map((item) => ({ value: item.id, label: item.name })))
}

function placeSearchOptions() {
  return listPlaces().then((list) => list.map((item) => ({ value: item.name, label: item.name })))
}

async function buildingSearchOptions(placeName?: string) {
  const list = await listAllBuildings()
  return list
    .filter((item) => !placeName || item.placeName === placeName)
    .map((item) => ({
      value: item.id,
      label: placeName ? item.name : `${item.placeName} ${item.name}`,
    }))
}

async function floorSearchOptions(placeName?: string, buildingId?: number) {
  const list = await listAllFloors()
  const numbers = [
    ...new Set(
      list
        .filter((item) => (!placeName || item.placeName === placeName) && (!buildingId || item.buildingId === Number(buildingId)))
        .map((item) => item.floorNo),
    ),
  ].sort((left, right) => left - right)
  return numbers.map((floorNo) => ({ value: floorNo, label: `${floorNo} 层` }))
}

async function roomSearchOptions(placeName?: string, buildingId?: number, floorNo?: number) {
  const list = await listAllRooms()
  return list
    .filter((item) => {
      if (placeName && item.placeName !== placeName) return false
      if (buildingId && item.buildingId !== Number(buildingId)) return false
      if (floorNo && item.floorNo !== Number(floorNo)) return false
      return true
    })
    .map((item) => ({
      value: item.id,
      label: floorNo ? item.roomNo : `${item.placeName} ${item.buildingName} ${item.floorNo}层 ${item.roomNo}`,
    }))
}

function PlaceField() {
  return <ProFormSelect name="placeId" label="宿舍地点" rules={[{ required: true, message: '请选择地点' }]} request={placeOptions} />
}

function BuildingField() {
  return (
    <ProFormDependency name={['placeId']}>
      {({ placeId }) => (
        <ProFormSelect
          name="buildingId"
          label="楼栋"
          rules={[{ required: true, message: '请选择楼栋' }]}
          params={{ placeId }}
          request={async () => {
            if (!placeId) return []
            const list = await listBuildings(Number(placeId))
            return list.map((item) => ({ value: item.id, label: item.name }))
          }}
        />
      )}
    </ProFormDependency>
  )
}

function FloorField() {
  return (
    <ProFormDependency name={['buildingId']}>
      {({ buildingId }) => (
        <ProFormSelect
          name="floorId"
          label="楼层"
          rules={[{ required: true, message: '请选择楼层' }]}
          params={{ buildingId }}
          request={async () => {
            if (!buildingId) return []
            const list = await listFloors(Number(buildingId))
            return list.map((item) => ({ value: item.id, label: `${item.floorNo} 层` }))
          }}
        />
      )}
    </ProFormDependency>
  )
}

export function DormsPage() {
  const actionRef = useRef<ActionType>(null)
  const columns: ProColumns<PlaceRow>[] = [
    {
      title: '地点',
      dataIndex: 'name',
      valueType: 'select',
      fieldProps: selectFieldProps,
      request: placeSearchOptions,
    },
    { title: '地址', dataIndex: 'address', search: false, ellipsis: true },
    { title: '楼栋数', dataIndex: 'buildingCount', search: false, width: 100 },
    { title: '备注', dataIndex: 'remark', search: false, ellipsis: true },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, row) => [
        <Link key="open" to={`/housing/buildings?place=${row.name}`}>
          查看楼栋
        </Link>,
        <ModalForm
          key="edit"
          title="编辑地点"
          trigger={<a>编辑</a>}
          modalProps={{ destroyOnClose: true }}
          initialValues={row}
          onFinish={async (values) => {
            await updatePlace(row.id, {
              name: String(values.name),
              address: values.address ? String(values.address) : undefined,
              remark: values.remark ? String(values.remark) : undefined,
            })
            message.success('已保存')
            reload(actionRef)
            return true
          }}
        >
          <ProFormText name="name" label="地点名称" rules={[{ required: true }]} />
          <ProFormText name="address" label="地址" />
          <ProFormText name="remark" label="备注" />
        </ModalForm>,
        <a
          key="del"
          onClick={() =>
            void confirmDormDelete({
              title: `地点「${row.name}」`,
              loadOccupants: () => placeOccupants(row.id),
              onDelete: () => deletePlace(row.id),
              onDone: () => reload(actionRef),
            })
          }
        >
          删除
        </a>,
      ],
    },
  ]
  return (
    <ProTable<PlaceRow>
      headerTitle="宿舍地点"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      cardBordered
      search={{ labelWidth: 'auto' }}
      options={{ reload: true, density: true, setting: true }}
      pagination={{ defaultPageSize: 10 }}
      toolBarRender={() => [
        <ModalForm
          key="add"
          title="新增地点"
          trigger={<Button type="primary">新增地点</Button>}
          modalProps={{ destroyOnClose: true }}
          onFinish={async (values) => {
            await createPlace({
              name: String(values.name),
              address: values.address ? String(values.address) : undefined,
              remark: values.remark ? String(values.remark) : undefined,
            })
            message.success('地点已添加')
            reload(actionRef)
            return true
          }}
        >
          <ProFormText name="name" label="地点名称" rules={[{ required: true }]} placeholder="主校区" />
          <ProFormText name="address" label="地址" />
          <ProFormText name="remark" label="备注" />
        </ModalForm>,
      ]}
      request={async (params) => {
        const list = await listPlaces()
        const name = String(params.name || '').trim()
        const filtered = list.filter((item) => !name || item.name === name)
        return { data: filtered, success: true, total: filtered.length }
      }}
    />
  )
}

export function DormBuildingsPage() {
  const actionRef = useRef<ActionType>(null)
  const columns: ProColumns<BuildingRow & { buildingId?: number }>[] = [
    {
      title: '地点',
      dataIndex: 'placeName',
      valueType: 'select',
      fieldProps: selectFieldProps,
      request: placeSearchOptions,
    },
    { title: '楼栋', dataIndex: 'name', search: false },
    {
      title: '楼栋',
      dataIndex: 'buildingId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: selectFieldProps,
      dependencies: ['placeName'],
      request: async (params) => buildingSearchOptions(params.placeName ? String(params.placeName) : undefined),
    },
    { title: '楼层数', dataIndex: 'floorCount', search: false, width: 100 },
    { title: '备注', dataIndex: 'remark', search: false },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, row) => [
        <Link key="open" to={`/housing/floors?building=${row.name}`}>
          查看楼层
        </Link>,
        <ModalForm
          key="edit"
          title="编辑楼栋"
          trigger={<a>编辑</a>}
          modalProps={{ destroyOnClose: true }}
          initialValues={row}
          onFinish={async (values) => {
            await updateBuilding(row.id, {
              name: String(values.name),
              remark: values.remark ? String(values.remark) : undefined,
            })
            message.success('已保存')
            reload(actionRef)
            return true
          }}
        >
          <ProFormText name="name" label="楼栋名称" rules={[{ required: true }]} />
          <ProFormText name="remark" label="备注" />
        </ModalForm>,
        <a
          key="del"
          onClick={() =>
            void confirmDormDelete({
              title: `楼栋「${row.placeName} ${row.name}」`,
              loadOccupants: () => buildingOccupants(row.id),
              onDelete: () => deleteBuilding(row.id),
              onDone: () => reload(actionRef),
            })
          }
        >
          删除
        </a>,
      ],
    },
  ]
  return (
    <ProTable<BuildingRow & { buildingId?: number }>
      headerTitle="楼栋"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      cardBordered
      search={{ labelWidth: 'auto' }}
      options={{ reload: true, density: true, setting: true }}
      toolBarRender={() => [
        <ModalForm
          key="add"
          title="新增楼栋"
          trigger={<Button type="primary">新增楼栋</Button>}
          modalProps={{ destroyOnClose: true }}
          onFinish={async (values) => {
            await createBuilding(Number(values.placeId), {
              name: String(values.name),
              remark: values.remark ? String(values.remark) : undefined,
            })
            message.success('楼栋已添加')
            reload(actionRef)
            return true
          }}
        >
          <PlaceField />
          <ProFormText name="name" label="楼栋名称" rules={[{ required: true }]} placeholder="1号楼" />
          <ProFormText name="remark" label="备注" />
        </ModalForm>,
      ]}
      request={async (params) => {
        const list = await listAllBuildings()
        const place = String(params.placeName || '').trim()
        const buildingId = params.buildingId ? Number(params.buildingId) : undefined
        const filtered = list.filter((item) => (!place || item.placeName === place) && (!buildingId || item.id === buildingId))
        return { data: filtered, success: true, total: filtered.length }
      }}
    />
  )
}

export function DormFloorsPage() {
  const actionRef = useRef<ActionType>(null)
  const columns: ProColumns<FloorRow>[] = [
    {
      title: '地点',
      dataIndex: 'placeName',
      valueType: 'select',
      fieldProps: selectFieldProps,
      request: placeSearchOptions,
    },
    { title: '楼栋', dataIndex: 'buildingName', search: false },
    {
      title: '楼栋',
      dataIndex: 'buildingId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: selectFieldProps,
      dependencies: ['placeName'],
      request: async (params) => buildingSearchOptions(params.placeName ? String(params.placeName) : undefined),
    },
    {
      title: '楼层',
      dataIndex: 'floorNo',
      valueType: 'select',
      fieldProps: selectFieldProps,
      dependencies: ['placeName', 'buildingId'],
      request: async (params) =>
        floorSearchOptions(params.placeName ? String(params.placeName) : undefined, params.buildingId ? Number(params.buildingId) : undefined),
      render: (_, row) => `${row.floorNo} 层`,
    },
    { title: '房间数', dataIndex: 'roomCount', search: false, width: 100 },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, row) => [
        <Link key="open" to={`/housing/rooms?floor=${row.floorNo}&building=${row.buildingName}`}>
          查看房间
        </Link>,
        <ModalForm
          key="edit"
          title="编辑楼层"
          trigger={<a>编辑</a>}
          modalProps={{ destroyOnClose: true }}
          initialValues={row}
          onFinish={async (values) => {
            await updateFloor(row.id, {
              floorNo: Number(values.floorNo),
              remark: values.remark ? String(values.remark) : undefined,
            })
            message.success('已保存')
            reload(actionRef)
            return true
          }}
        >
          <ProFormDigit name="floorNo" label="楼层" min={1} max={40} rules={[{ required: true }]} />
          <ProFormText name="remark" label="备注" />
        </ModalForm>,
        <a
          key="del"
          onClick={() =>
            void confirmDormDelete({
              title: `楼层「${row.buildingName} ${row.floorNo}层」`,
              loadOccupants: () => floorOccupants(row.id),
              onDelete: () => deleteFloor(row.id),
              onDone: () => reload(actionRef),
            })
          }
        >
          删除
        </a>,
      ],
    },
  ]
  return (
    <ProTable<FloorRow>
      headerTitle="楼层"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      cardBordered
      search={{ labelWidth: 'auto' }}
      options={{ reload: true, density: true, setting: true }}
      toolBarRender={() => [
        <ModalForm
          key="add"
          title="新增楼层"
          trigger={<Button type="primary">新增楼层</Button>}
          modalProps={{ destroyOnClose: true }}
          initialValues={{ bedCount: 6 }}
          onFinish={async (values) => {
            const rooms = roomNumbers(values.roomNos)
            if (rooms.length && !values.genderLimit) {
              message.error('填写了房间号时，必须选择男女宿舍')
              return false
            }
            await createFloor(Number(values.buildingId), {
              floorNo: Number(values.floorNo),
              roomNos: rooms,
              bedCount: Number(values.bedCount ?? 6),
              genderLimit: values.genderLimit ? String(values.genderLimit) : undefined,
            })
            message.success(rooms.length ? `楼层已添加，并建了 ${rooms.length} 间房` : '楼层已添加')
            reload(actionRef)
            return true
          }}
        >
          <PlaceField />
          <BuildingField />
          <ProFormDigit name="floorNo" label="楼层" min={1} max={40} rules={[{ required: true, message: '请填写楼层' }]} placeholder="老师自己填，如 3" />
          <ProFormTextArea
            name="roomNos"
            label="本层房间"
            placeholder="如 301,302,303。留空则只建楼层（楼层本身不区分男女）"
            fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }}
            extra="楼层不用选男女；若本层直接建房，则这些房间统一选男女宿舍"
          />
          <ProFormSelect
            name="genderLimit"
            label="房间男女宿舍"
            options={ROOM_GENDER_OPTIONS}
            extra="仅在上面填写了房间号时必选"
          />
          <ProFormDigit name="bedCount" label="每间床位" min={0} max={12} extra="默认 6 人间，可改成 4 人间、8 人间" />
        </ModalForm>,
      ]}
      request={async (params) => {
        const list = await listAllFloors()
        const place = String(params.placeName || '').trim()
        const buildingId = params.buildingId ? Number(params.buildingId) : undefined
        const floorNo = params.floorNo ? Number(params.floorNo) : undefined
        const filtered = list.filter(
          (item) =>
            (!place || item.placeName === place) &&
            (!buildingId || item.buildingId === buildingId) &&
            (!floorNo || item.floorNo === floorNo),
        )
        return { data: filtered, success: true, total: filtered.length }
      }}
    />
  )
}

export function DormRoomsPage() {
  const actionRef = useRef<ActionType>(null)
  const columns: ProColumns<RoomRow & { roomId?: number }>[] = [
    {
      title: '地点',
      dataIndex: 'placeName',
      valueType: 'select',
      fieldProps: selectFieldProps,
      request: placeSearchOptions,
    },
    { title: '楼栋', dataIndex: 'buildingName', search: false },
    {
      title: '楼栋',
      dataIndex: 'buildingId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: selectFieldProps,
      dependencies: ['placeName'],
      request: async (params) => buildingSearchOptions(params.placeName ? String(params.placeName) : undefined),
    },
    {
      title: '楼层',
      dataIndex: 'floorNo',
      valueType: 'select',
      fieldProps: selectFieldProps,
      dependencies: ['placeName', 'buildingId'],
      request: async (params) =>
        floorSearchOptions(params.placeName ? String(params.placeName) : undefined, params.buildingId ? Number(params.buildingId) : undefined),
      width: 80,
      render: (_, row) => `${row.floorNo} 层`,
    },
    { title: '房间号', dataIndex: 'roomNo', search: false },
    {
      title: '房间',
      dataIndex: 'roomId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: selectFieldProps,
      dependencies: ['placeName', 'buildingId', 'floorNo'],
      request: async (params) =>
        roomSearchOptions(
          params.placeName ? String(params.placeName) : undefined,
          params.buildingId ? Number(params.buildingId) : undefined,
          params.floorNo ? Number(params.floorNo) : undefined,
        ),
    },
    {
      title: '男女宿舍',
      dataIndex: 'genderLimit',
      valueType: 'select',
      valueEnum: { MALE: { text: '男生宿舍' }, FEMALE: { text: '女生宿舍' }, ANY: { text: '未设' } },
      width: 110,
      render: (_, row) => GENDER[row.genderLimit] || row.genderLimit,
    },
    { title: '床位数', dataIndex: 'bedCount', search: false, width: 90 },
    { title: '空闲床', dataIndex: 'freeCount', search: false, width: 90 },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, row) => [
        <Link key="open" to={`/housing/beds?room=${row.roomNo}`}>
          查看床位
        </Link>,
        <ModalForm
          key="edit"
          title="编辑房间"
          trigger={<a>编辑</a>}
          modalProps={{ destroyOnClose: true }}
          initialValues={row}
          onFinish={async (values) => {
            await updateRoom(row.id, {
              roomNo: String(values.roomNo),
              genderLimit: String(values.genderLimit),
              remark: values.remark ? String(values.remark) : undefined,
            })
            message.success('已保存')
            reload(actionRef)
            return true
          }}
        >
          <ProFormText name="roomNo" label="房间号" rules={[{ required: true }]} />
          <ProFormSelect
            name="genderLimit"
            label="男女宿舍"
            rules={[{ required: true, message: '房间必须选择男女宿舍' }]}
            options={ROOM_GENDER_OPTIONS}
          />
          <ProFormText name="remark" label="备注" />
        </ModalForm>,
        <a
          key="del"
          onClick={() =>
            void confirmDormDelete({
              title: `房间「${row.buildingName} ${row.floorNo}层 ${row.roomNo}」`,
              loadOccupants: () => roomOccupants(row.id),
              onDelete: () => deleteRoom(row.id),
              onDone: () => reload(actionRef),
            })
          }
        >
          删除
        </a>,
      ],
    },
  ]
  return (
    <ProTable<RoomRow & { roomId?: number }>
      headerTitle="房间"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      cardBordered
      search={{ labelWidth: 'auto' }}
      options={{ reload: true, density: true, setting: true }}
      scroll={{ x: 980 }}
      toolBarRender={() => [
        <ModalForm
          key="add"
          title="新增房间"
          trigger={<Button type="primary">新增房间</Button>}
          modalProps={{ destroyOnClose: true }}
          initialValues={{ bedCount: 6 }}
          onFinish={async (values) => {
            await createRoom(Number(values.floorId), {
              roomNo: String(values.roomNo),
              bedCount: Number(values.bedCount ?? 6),
              genderLimit: String(values.genderLimit),
              remark: values.remark ? String(values.remark) : undefined,
            })
            message.success('房间已添加，床位已按人数生成')
            reload(actionRef)
            return true
          }}
        >
          <PlaceField />
          <BuildingField />
          <FloorField />
          <ProFormText name="roomNo" label="房间号" rules={[{ required: true }]} placeholder="如 305" />
          <ProFormSelect
            name="genderLimit"
            label="男女宿舍"
            rules={[{ required: true, message: '房间必须选择男女宿舍' }]}
            options={ROOM_GENDER_OPTIONS}
            extra="楼层不区分男女，房间必须标明男生宿舍或女生宿舍"
          />
          <ProFormDigit name="bedCount" label="床位数" min={0} max={12} extra="默认 6 人间" />
          <ProFormText name="remark" label="备注" />
        </ModalForm>,
      ]}
      request={async (params) => {
        const list = await listAllRooms()
        const place = String(params.placeName || '').trim()
        const buildingId = params.buildingId ? Number(params.buildingId) : undefined
        const floorNo = params.floorNo ? Number(params.floorNo) : undefined
        const roomId = params.roomId ? Number(params.roomId) : undefined
        const filtered = list.filter(
          (item) =>
            (!place || item.placeName === place) &&
            (!buildingId || item.buildingId === buildingId) &&
            (!floorNo || item.floorNo === floorNo) &&
            (!roomId || item.id === roomId) &&
            (!params.genderLimit || item.genderLimit === params.genderLimit),
        )
        return { data: filtered, success: true, total: filtered.length }
      }}
    />
  )
}

export function DormBedsPage() {
  const actionRef = useRef<ActionType>(null)
  const columns: ProColumns<BedRow>[] = [
    {
      title: '地点',
      dataIndex: 'placeName',
      valueType: 'select',
      fieldProps: selectFieldProps,
      request: placeSearchOptions,
    },
    { title: '楼栋', dataIndex: 'buildingName', search: false },
    {
      title: '楼栋',
      dataIndex: 'buildingId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: selectFieldProps,
      dependencies: ['placeName'],
      request: async (params) => buildingSearchOptions(params.placeName ? String(params.placeName) : undefined),
    },
    {
      title: '楼层',
      dataIndex: 'floorNo',
      valueType: 'select',
      fieldProps: selectFieldProps,
      dependencies: ['placeName', 'buildingId'],
      request: async (params) =>
        floorSearchOptions(params.placeName ? String(params.placeName) : undefined, params.buildingId ? Number(params.buildingId) : undefined),
      width: 80,
      render: (_, row) => (row.floorNo ? `${row.floorNo} 层` : '-'),
    },
    { title: '房间', dataIndex: 'roomNo', search: false },
    {
      title: '房间',
      dataIndex: 'roomId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: selectFieldProps,
      dependencies: ['placeName', 'buildingId', 'floorNo'],
      request: async (params) =>
        roomSearchOptions(
          params.placeName ? String(params.placeName) : undefined,
          params.buildingId ? Number(params.buildingId) : undefined,
          params.floorNo ? Number(params.floorNo) : undefined,
        ),
    },
    { title: '床位', dataIndex: 'bedNo', search: false, render: (_, row) => `${row.bedNo} 号床` },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: { FREE: { text: '空闲' }, OCCUPIED: { text: '已入住' } },
      render: (_, row) => (
        <Tag color={row.status === 'FREE' ? 'success' : 'error'}>{row.status === 'FREE' ? '空闲' : '已入住'}</Tag>
      ),
    },
    { title: '学员', dataIndex: 'studentName', search: false, render: (_, row) => row.studentName || '-' },
    { title: '电话', dataIndex: 'studentPhone', search: false, render: (_, row) => row.studentPhone || '-' },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, row) =>
        row.status === 'FREE'
          ? [
              <ModalForm
                key="assign"
                title={`分配 ${row.roomNo || ''} ${row.bedNo} 号床`}
                trigger={<a>分配学员</a>}
                modalProps={{ destroyOnClose: true }}
                onFinish={async (values) => {
                  await assignBed(row.id, Number(values.studentId))
                  message.success('已入住')
                  reload(actionRef)
                  return true
                }}
              >
                <ProFormSelect
                  name="studentId"
                  label="学员"
                  rules={[{ required: true, message: '请选择学员' }]}
                  request={async () => {
                    const students = await listStudents()
                    return students.map((item) => ({
                      value: item.id,
                      label: `${item.name} ${item.gender === 'MALE' ? '男' : item.gender === 'FEMALE' ? '女' : ''} ${item.phone}`,
                    }))
                  }}
                />
              </ModalForm>,
            ]
          : [
              <a
                key="release"
                onClick={async () => {
                  await releaseBed(row.id)
                  message.success('已退宿')
                  reload(actionRef)
                }}
              >
                退宿
              </a>,
            ],
    },
  ]
  return (
    <ProTable<BedRow>
      headerTitle="床位"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      cardBordered
      search={{ labelWidth: 'auto' }}
      options={{ reload: true, density: true, setting: true }}
      scroll={{ x: 1100 }}
      toolBarRender={() => [
        <ModalForm
          key="add"
          title="新增床位"
          trigger={<Button type="primary">新增床位</Button>}
          modalProps={{ destroyOnClose: true }}
          onFinish={async (values) => {
            await addBed(Number(values.roomId))
            message.success('已增加一个床位')
            reload(actionRef)
            return true
          }}
        >
          <PlaceField />
          <BuildingField />
          <FloorField />
          <ProFormDependency name={['floorId']}>
            {({ floorId }) => (
              <ProFormSelect
                name="roomId"
                label="房间"
                rules={[{ required: true, message: '请选择房间' }]}
                params={{ floorId }}
                request={async () => {
                  if (!floorId) return []
                  const rooms = await listAllRooms()
                  return rooms
                    .filter((item) => item.floorId === Number(floorId))
                    .map((item) => ({ value: item.id, label: item.roomNo }))
                }}
              />
            )}
          </ProFormDependency>
        </ModalForm>,
      ]}
      request={async (params) => {
        const list = await listAllBeds()
        const place = String(params.placeName || '').trim()
        const buildingId = params.buildingId ? Number(params.buildingId) : undefined
        const floorNo = params.floorNo ? Number(params.floorNo) : undefined
        const roomId = params.roomId ? Number(params.roomId) : undefined
        const filtered = list.filter(
          (item) =>
            (!place || item.placeName === place) &&
            (!buildingId || item.buildingId === buildingId) &&
            (!floorNo || item.floorNo === floorNo) &&
            (!roomId || item.roomId === roomId) &&
            (!params.status || item.status === params.status),
        )
        return { data: filtered, success: true, total: filtered.length }
      }}
    />
  )
}
