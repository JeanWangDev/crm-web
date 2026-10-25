import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components'
import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormSelect,
  ProFormSwitch,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { Button, Empty, Form, Tag, message } from 'antd'
import dayjs from 'dayjs'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listPickups, markPickup, type PickupRow } from '../api/pickups'
import { listStudents, saveTravel } from '../api/students'
import { listUsers } from '../api/users'
import { ARRIVAL_WAYS, arrivalLabel, arrivalWayOf } from '../constants/arrival'
import { exportCsv } from '../utils/exportCsv'

const trafficValueEnum = Object.fromEntries(
  ARRIVAL_WAYS.map((item) => [item.value, { text: item.label }]),
)

export function PickupPage() {
  const actionRef = useRef<ActionType>(null)
  const tableFormRef = useRef<ProFormInstance>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [exporting, setExporting] = useState(false)

  const columns: ProColumns<PickupRow>[] = [
    { title: '学员', dataIndex: 'studentName' },
    { title: '电话', dataIndex: 'phone', width: 140, copyable: true, search: false },
    { title: '抵达日期', dataIndex: 'arriveDate', valueType: 'dateRange', hideInTable: true },
    {
      title: '抵达时间',
      dataIndex: 'arriveDate',
      search: false,
      width: 160,
      render: (_, row) =>
        row.arriveDate ? `${row.arriveDate}${row.arriveTime ? ` ${String(row.arriveTime).slice(0, 5)}` : ''}` : '-',
    },
    {
      title: '怎么来',
      dataIndex: 'trafficType',
      valueType: 'select',
      valueEnum: trafficValueEnum,
      width: 110,
      render: (_, row) => arrivalLabel(row.trafficType) || row.station || '-',
    },
    {
      title: '接站老师',
      dataIndex: 'pickupUserName',
      valueType: 'select',
      width: 110,
      fieldProps: { showSearch: true, allowClear: true, optionFilterProp: 'label' },
      request: async () => (await listUsers()).map((item) => ({ label: item.name, value: item.name })),
    },
    {
      title: '状态',
      dataIndex: 'pickupStatus',
      valueType: 'select',
      valueEnum: {
        WAITING: { text: '待接站', status: 'Processing' },
        PICKED: { text: '已接到', status: 'Success' },
      },
      render: (_, row) => (
        <Tag color={row.pickupStatus === 'PICKED' ? 'success' : 'processing'}>
          {row.pickupStatus === 'PICKED' ? '已接到' : '待接站'}
        </Tag>
      ),
      width: 100,
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true, search: false },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, row) =>
        row.pickupStatus === 'WAITING'
          ? [
              <a
                key="pick"
                onClick={async () => {
                  await markPickup(row.studentId, 'PICKED')
                  message.success('已标记接到')
                  actionRef.current?.reload()
                }}
              >
                标记已接到
              </a>,
            ]
          : [
              <a
                key="undo"
                onClick={async () => {
                  await markPickup(row.studentId, 'WAITING')
                  message.success('已撤销')
                  actionRef.current?.reload()
                }}
              >
                撤销
              </a>,
            ],
    },
  ]

  return (
    <ProTable<PickupRow>
      headerTitle="接站看板"
      actionRef={actionRef}
      formRef={tableFormRef}
      rowKey="id"
      columns={columns}
      scroll={{ x: 1200 }}
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
              const values = tableFormRef.current?.getFieldsValue?.() || {}
              const range = values.arriveDate as string[] | undefined
              const list = await listPickups({ from: range?.[0], to: range?.[1] })
              const name = String(values.studentName || '').trim()
              const status = values.pickupStatus as string | undefined
              const filtered = list.filter((item) => {
                if (name && !item.studentName.includes(name)) return false
                if (status && item.pickupStatus !== status) return false
                if (values.trafficType && item.trafficType !== values.trafficType) return false
                if (values.pickupUserName && item.pickupUserName !== values.pickupUserName) return false
                return true
              })
              if (!filtered.length) {
                message.warning('当前查询条件下没有可导出的数据')
                return
              }
              exportCsv(
                '接站看板',
                ['学员', '电话', '抵达日期', '抵达时间', '怎么来', '接站老师', '状态', '备注'],
                filtered.map((row) => [
                  row.studentName,
                  row.phone,
                  row.arriveDate || '',
                  row.arriveTime ? String(row.arriveTime).slice(0, 5) : '',
                  arrivalLabel(row.trafficType) || row.station || '',
                  row.pickupUserName || '',
                  row.pickupStatus === 'PICKED' ? '已接到' : '待接站',
                  row.remark || '',
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
        <ModalForm
          key="add"
          title="登记来校接站"
          form={form}
          trigger={<Button type="primary">新增接站</Button>}
          modalProps={{ destroyOnClose: true, width: 560 }}
          initialValues={{ needPickup: true, trafficType: 'SZ_NORTH' }}
          onFinish={async (values) => {
            const needPickup = Boolean(values.needPickup)
            const way = arrivalWayOf(String(values.trafficType || ''))
            const arriveAt = values.arriveAt ? dayjs(values.arriveAt as string) : null
            await saveTravel(Number(values.studentId), {
              arriveDate: arriveAt ? arriveAt.format('YYYY-MM-DD') : undefined,
              arriveTime: arriveAt ? arriveAt.format('HH:mm:ss') : undefined,
              trafficType: values.trafficType ? String(values.trafficType) : undefined,
              needPickup,
              // 接站点跟「怎么来」同一套，不再单独选，避免北站/深圳站打架
              station: needPickup ? way?.station || way?.label : undefined,
              pickupUserId: needPickup && values.pickupUserId ? Number(values.pickupUserId) : undefined,
              remark: values.remark ? String(values.remark) : undefined,
            })
            message.success(needPickup ? '已登记，进入接站看板' : '已登记自行到达，不会出现在接站看板')
            actionRef.current?.reload()
            return true
          }}
        >
          <ProFormSelect
            name="studentId"
            label="学员"
            rules={[{ required: true, message: '请选择要来上学的学员' }]}
            showSearch
            fieldProps={{ optionFilterProp: 'label' }}
            request={async () => {
              const students = await listStudents()
              return students.map((item) => ({
                value: item.id,
                label: `${item.name} ${item.phone} · 计划入学 ${item.planJoinDate || '-'}`,
              }))
            }}
          />
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
            rules={[{ required: true }]}
            options={ARRIVAL_WAYS.map((item) => ({ value: item.value, label: item.label }))}
            fieldProps={{
              onChange: (value: string) => {
                const way = arrivalWayOf(value)
                if (!way) return
                form.setFieldsValue({ needPickup: way.needPickup })
              },
            }}
            extra="深圳北站/深圳站/大巴/飞机默认需要接站；家人送/自驾/自行到达默认不接"
          />
          <ProFormSwitch name="needPickup" label="需要接站" />
          <ProFormSelect
            name="pickupUserId"
            label="接站老师"
            showSearch
            fieldProps={{ optionFilterProp: 'label' }}
            request={async () => (await listUsers()).map((item) => ({ value: item.id, label: item.name }))}
          />
          <ProFormTextArea name="remark" label="备注" placeholder="车次/航班号等" />
        </ModalForm>,
      ]}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                还没有需要接站的学员。交钱转学员后，点右上角「新增接站」，选学员并勾选「需要接站」。
                <br />
                <a onClick={() => navigate('/students')}>去学员档案</a>
              </span>
            }
          />
        ),
      }}
      request={async (params) => {
        const range = params.arriveDate as string[] | undefined
        const list = await listPickups({
          from: range?.[0],
          to: range?.[1],
        })
        const name = String(params.studentName || '').trim()
        const status = params.pickupStatus as string | undefined
        const filtered = list.filter((item) => {
          if (name && !item.studentName.includes(name)) return false
          if (status && item.pickupStatus !== status) return false
          if (params.trafficType && item.trafficType !== params.trafficType) return false
          if (params.pickupUserName && item.pickupUserName !== params.pickupUserName) return false
          return true
        })
        return { data: filtered, success: true, total: filtered.length }
      }}
    />
  )
}
