import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  DrawerForm,
  ProFormDatePicker,
  ProFormDateTimePicker,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { Button, Descriptions, Drawer, Form, Space, Tag, Timeline, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addStudentFollowup,
  listStudents,
  saveTravel,
  studentDetail,
  updateStudent,
  type Student,
  type Travel,
} from '../api/students'
import { listUsers, type Staff } from '../api/users'
import { ARRIVAL_WAYS, arrivalWayOf } from '../constants/arrival'
import { exportCsv } from '../utils/exportCsv'

export function StudentsPage() {
  const actionRef = useRef<ActionType>(null)
  const formRef = useRef<{ getFieldsValue?: () => Record<string, unknown> }>()
  const [open, setOpen] = useState(false)
  const [student, setStudent] = useState<Student>()
  const [travel, setTravel] = useState<Travel>({})
  const [followups, setFollowups] = useState<{ id: number; content: string; createdAt: string }[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [bedLabel, setBedLabel] = useState('')
  const [exporting, setExporting] = useState(false)
  const [travelForm] = Form.useForm()

  useEffect(() => {
    void listUsers().then(setStaff).catch(() => undefined)
  }, [])

  async function show(row: Student) {
    try {
      const detail = await studentDetail(row.id)
      setStudent(detail.student)
      setTravel(detail.travel && detail.travel.id ? detail.travel : {})
      setFollowups(detail.followups || [])
      setBedLabel(detail.bed?.label || '')
      setOpen(true)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      message.error(detail || '打开档案失败')
    }
  }

  const columns: ProColumns<Student>[] = [
    { title: '姓名', dataIndex: 'name', copyable: true },
    { title: '电话', dataIndex: 'phone', copyable: true, width: 140 },
    {
      title: '性别',
      dataIndex: 'gender',
      valueType: 'select',
      valueEnum: { MALE: { text: '男' }, FEMALE: { text: '女' } },
      width: 80,
      render: (_, row) => (row.gender === 'MALE' ? '男' : row.gender === 'FEMALE' ? '女' : '-'),
    },
    { title: '计划入学', dataIndex: 'planJoinDate', valueType: 'date', width: 130 },
    {
      title: '状态',
      dataIndex: 'studentStatus',
      valueType: 'select',
      valueEnum: {
        WAITING: { text: '待报到', status: 'Warning' },
        ENROLLED: { text: '已入校', status: 'Success' },
      },
      render: (_, row) => (
        <Tag color={row.studentStatus === 'ENROLLED' ? 'success' : 'gold'}>
          {row.studentStatus === 'ENROLLED' ? '已入校' : '待报到'}
        </Tag>
      ),
      width: 100,
    },
    { title: '家庭住址', dataIndex: 'homeAddress', ellipsis: true, search: false },
    { title: '紧急联系人', dataIndex: 'emergencyName', search: false, width: 120 },
    {
      title: '归属顾问',
      dataIndex: 'ownerId',
      valueType: 'select',
      width: 110,
      fieldProps: { showSearch: true, allowClear: true, optionFilterProp: 'label' },
      request: async () => (await listUsers()).map((item) => ({ label: item.name, value: item.id })),
      render: (_, row) => row.ownerName || '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, row) => [
        <a key="detail" onClick={() => void show(row)}>
          详情
        </a>,
      ],
    },
  ]

  return (
    <>
      <ProTable<Student>
        headerTitle="正式学员"
        actionRef={actionRef}
        formRef={formRef as never}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1400 }}
        cardBordered
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
        pagination={{ defaultPageSize: 10 }}
        toolBarRender={() => [
          <Button
            key="export"
            loading={exporting}
            onClick={async () => {
              setExporting(true)
              try {
                const list = await listStudents()
                const values = (formRef.current?.getFieldsValue?.() || {}) as Record<string, unknown>
                const name = String(values.name || '').trim()
                const phone = String(values.phone || '').trim()
                const filtered = list.filter((item) => {
                  if (name && !item.name.includes(name)) return false
                  if (phone && !item.phone.includes(phone)) return false
                  if (values.studentStatus && item.studentStatus !== values.studentStatus) return false
                  if (values.gender && item.gender !== values.gender) return false
                  if (values.ownerId && item.ownerId !== Number(values.ownerId)) return false
                  if (values.planJoinDate && item.planJoinDate !== values.planJoinDate) return false
                  return true
                })
                if (!filtered.length) {
                  message.warning('当前查询条件下没有可导出的数据')
                  return
                }
                exportCsv(
                  '正式学员',
                  ['姓名', '电话', '性别', '计划入学', '状态', '家庭住址', '紧急联系人', '紧急电话', '归属顾问'],
                  filtered.map((row) => [
                    row.name,
                    row.phone,
                    row.gender === 'MALE' ? '男' : row.gender === 'FEMALE' ? '女' : '',
                    row.planJoinDate || '',
                    row.studentStatus === 'ENROLLED' ? '已入校' : '待报到',
                    row.homeAddress || '',
                    row.emergencyName || '',
                    row.emergencyPhone || '',
                    row.ownerName || '',
                  ]),
                )
                message.success(`已导出 ${filtered.length} 条`)
              } finally {
                setExporting(false)
              }
            }}
          >
            导出信息
          </Button>,
        ]}
        request={async (params) => {
          const list = await listStudents()
          const name = String(params.name || '').trim()
          const phone = String(params.phone || '').trim()
          const filtered = list.filter((item) => {
            if (name && !item.name.includes(name)) return false
            if (phone && !item.phone.includes(phone)) return false
            if (params.studentStatus && item.studentStatus !== params.studentStatus) return false
            if (params.gender && item.gender !== params.gender) return false
            if (params.ownerId && item.ownerId !== Number(params.ownerId)) return false
            if (params.planJoinDate && item.planJoinDate !== params.planJoinDate) return false
            return true
          })
          const current = params.current || 1
          const pageSize = params.pageSize || 10
          const start = (current - 1) * pageSize
          return { data: filtered.slice(start, start + pageSize), success: true, total: filtered.length }
        }}
      />
      <Drawer title="学员档案" width={640} open={open} onClose={() => setOpen(false)} destroyOnClose>
        {student && (
          <>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="姓名">{student.name}</Descriptions.Item>
              <Descriptions.Item label="电话">{student.phone}</Descriptions.Item>
              <Descriptions.Item label="性别">{student.gender === 'MALE' ? '男' : student.gender === 'FEMALE' ? '女' : '未填'}</Descriptions.Item>
              <Descriptions.Item label="计划入学">{student.planJoinDate}</Descriptions.Item>
              <Descriptions.Item label="报到">{student.studentStatus === 'ENROLLED' ? '已报到' : '待报到'}</Descriptions.Item>
              <Descriptions.Item label="床位" span={2}>
                <Space>
                  <span>{bedLabel || '未分配'}</span>
                  <Link to="/housing/assign">去床位分配</Link>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="家庭住址" span={2}>{student.homeAddress}</Descriptions.Item>
              <Descriptions.Item label="紧急联系人">{student.emergencyName}</Descriptions.Item>
              <Descriptions.Item label="紧急电话">{student.emergencyPhone}</Descriptions.Item>
              <Descriptions.Item label="归属">{student.ownerName || '-'}</Descriptions.Item>
            </Descriptions>
            <DrawerForm
              title="修改档案"
              trigger={<Button style={{ marginTop: 16 }}>修改档案</Button>}
              initialValues={{ ...student }}
              onFinish={async (values) => {
                const saved = await updateStudent(student.id, {
                  name: String(values.name),
                  phone: String(values.phone),
                  gender: values.gender as Student['gender'],
                  homeAddress: String(values.homeAddress),
                  emergencyName: String(values.emergencyName),
                  emergencyPhone: String(values.emergencyPhone),
                  planJoinDate: dayjs(values.planJoinDate as string).format('YYYY-MM-DD'),
                })
                setStudent({ ...student, ...saved })
                message.success('档案已更新')
                actionRef.current?.reload()
                return true
              }}
            >
              <ProFormText name="name" label="姓名" rules={[{ required: true }]} />
              <ProFormText name="phone" label="电话" rules={[{ required: true }]} />
              <ProFormSelect
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
                options={[
                  { value: 'MALE', label: '男' },
                  { value: 'FEMALE', label: '女' },
                ]}
              />
              <ProFormText name="homeAddress" label="家庭住址" rules={[{ required: true }]} />
              <ProFormText name="emergencyName" label="紧急联系人" rules={[{ required: true }]} />
              <ProFormText name="emergencyPhone" label="紧急联系电话" rules={[{ required: true }]} />
              <ProFormDatePicker name="planJoinDate" label="计划入学日期" rules={[{ required: true }]} />
            </DrawerForm>
            <DrawerForm
              title="登记来校行程"
              form={travelForm}
              trigger={<Button style={{ marginTop: 16, marginLeft: 8 }}>登记行程</Button>}
              initialValues={{
                ...travel,
                needPickup: Boolean(travel.needPickup),
                arriveAt:
                  travel.arriveDate
                    ? dayjs(
                        `${travel.arriveDate} ${travel.arriveTime ? String(travel.arriveTime).slice(0, 5) : '00:00'}`,
                      )
                    : undefined,
              }}
              onFinish={async (values) => {
                const needPickup = Boolean(values.needPickup)
                const way = arrivalWayOf(String(values.trafficType || ''))
                const arriveAt = values.arriveAt ? dayjs(values.arriveAt as string) : null
                const saved = await saveTravel(student.id, {
                  arriveDate: arriveAt ? arriveAt.format('YYYY-MM-DD') : undefined,
                  arriveTime: arriveAt ? arriveAt.format('HH:mm:ss') : undefined,
                  trafficType: values.trafficType ? String(values.trafficType) : undefined,
                  needPickup,
                  station: needPickup ? way?.station || way?.label : undefined,
                  pickupUserId: needPickup && values.pickupUserId ? Number(values.pickupUserId) : undefined,
                  remark: values.remark ? String(values.remark) : undefined,
                })
                setTravel(saved)
                message.success(needPickup ? '已登记，会出现在接站看板' : '已登记自行到达')
                return true
              }}
            >
              <ProFormDateTimePicker
                name="arriveAt"
                label="抵达时间"
                rules={[{ required: true, message: '请选择抵达日期和时间' }]}
                fieldProps={{
                  format: 'YYYY-MM-DD HH:mm',
                  showTime: { format: 'HH:mm' },
                  style: { width: '100%' },
                }}
              />
              <ProFormSelect
                name="trafficType"
                label="怎么来"
                options={ARRIVAL_WAYS.map((item) => ({ value: item.value, label: item.label }))}
                rules={[{ required: true }]}
                fieldProps={{
                  onChange: (value: string) => {
                    const way = arrivalWayOf(value)
                    if (!way) return
                    travelForm.setFieldsValue({ needPickup: way.needPickup })
                  },
                }}
              />
              <ProFormSwitch name="needPickup" label="需要接站" />
              <ProFormSelect
                name="pickupUserId"
                label="接站老师"
                options={staff.map((item) => ({ value: item.id, label: item.name }))}
              />
              <ProFormTextArea name="remark" label="备注" placeholder="车次/航班号等" />
            </DrawerForm>
            <DrawerForm
              title="在校跟进"
              trigger={<Button style={{ marginTop: 16, marginLeft: 8 }}>写跟进</Button>}
              onFinish={async (values) => {
                await addStudentFollowup(student.id, String(values.content || ''))
                const detail = await studentDetail(student.id)
                setFollowups(detail.followups || [])
                message.success('跟进已保存')
                return true
              }}
            >
              <ProFormTextArea name="content" label="内容" rules={[{ required: true }]} />
            </DrawerForm>
            <Timeline
              style={{ marginTop: 24 }}
              items={followups.map((item) => ({
                children: (
                  <div>
                    <div>{item.content}</div>
                    <div style={{ color: '#999' }}>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</div>
                  </div>
                ),
              }))}
            />
          </>
        )}
      </Drawer>
    </>
  )
}
