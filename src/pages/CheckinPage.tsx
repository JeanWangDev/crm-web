import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components'
import { ProTable } from '@ant-design/pro-components'
import { Button, Tag, message } from 'antd'
import { useRef, useState } from 'react'
import { cancelCheckin, confirmCheckin, listCheckins, type CheckinRow } from '../api/checkins'
import { listUsers } from '../api/users'
import { arrivalLabel } from '../constants/arrival'
import { exportCsv } from '../utils/exportCsv'

/** 报到名单只看「何时到校」，接站状态去接站看板 */
function travelText(row: CheckinRow) {
  if (!row.arriveDate) return '未登记'
  const time = row.arriveTime ? String(row.arriveTime).slice(0, 5) : ''
  const way = arrivalLabel(row.trafficType)
  return [row.arriveDate, time, way !== '-' ? way : ''].filter(Boolean).join(' ')
}

export function CheckinPage() {
  const actionRef = useRef<ActionType>(null)
  const formRef = useRef<ProFormInstance>(undefined)
  const [exporting, setExporting] = useState(false)

  const columns: ProColumns<CheckinRow>[] = [
    { title: '姓名', dataIndex: 'name', width: 100 },
    {
      title: '归属顾问',
      dataIndex: 'ownerName',
      valueType: 'select',
      width: 100,
      fieldProps: { showSearch: true, allowClear: true, optionFilterProp: 'label' },
      request: async () => (await listUsers()).map((item) => ({ label: item.name, value: item.name })),
    },
    { title: '电话', dataIndex: 'phone', width: 130, search: false, copyable: true },
    {
      title: '性别',
      dataIndex: 'gender',
      valueType: 'select',
      valueEnum: { MALE: { text: '男' }, FEMALE: { text: '女' } },
      width: 70,
      render: (_, row) => (row.gender === 'MALE' ? '男' : row.gender === 'FEMALE' ? '女' : '-'),
    },
    { title: '计划入学', dataIndex: 'planJoinDate', width: 110, search: false },
    {
      title: '到校行程',
      dataIndex: 'arriveDate',
      search: false,
      ellipsis: true,
      render: (_, row) => travelText(row),
    },
    {
      title: '床位',
      dataIndex: 'bedLabel',
      search: false,
      ellipsis: true,
      render: (_, row) => row.bedLabel || '未分配',
    },
    {
      title: '报到',
      dataIndex: 'studentStatus',
      valueType: 'select',
      initialValue: 'WAITING',
      fieldProps: { allowClear: false },
      valueEnum: {
        WAITING: { text: '待报到' },
        ENROLLED: { text: '已报到' },
      },
      render: (_, row) => (
        <Tag color={row.studentStatus === 'ENROLLED' ? 'success' : 'gold'}>
          {row.studentStatus === 'ENROLLED' ? '已报到' : '待报到'}
        </Tag>
      ),
      width: 90,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, row) =>
        row.studentStatus === 'WAITING'
          ? [
              <a
                key="in"
                onClick={async () => {
                  await confirmCheckin(row.studentId)
                  message.success('已确认报到')
                  actionRef.current?.reload()
                }}
              >
                确认报到
              </a>,
            ]
          : [
              <a
                key="out"
                onClick={async () => {
                  await cancelCheckin(row.studentId)
                  message.success('已改回待报到')
                  actionRef.current?.reload()
                }}
              >
                撤销报到
              </a>,
            ],
    },
  ]

  return (
    <ProTable<CheckinRow>
      headerTitle="报到名单"
      actionRef={actionRef}
      formRef={formRef}
      rowKey="studentId"
      columns={columns}
      scroll={{ x: 1100 }}
      cardBordered
      search={{ labelWidth: 'auto' }}
      options={{ reload: true, density: true, setting: true }}
      pagination={{ defaultPageSize: 10 }}
      form={{ initialValues: { studentStatus: 'WAITING' } }}
      toolBarRender={() => [
        <Button
          key="export"
          loading={exporting}
          onClick={async () => {
            setExporting(true)
            try {
              const list = await listCheckins()
              const values = formRef.current?.getFieldsValue?.() || {}
              const name = String(values.name || '').trim()
              const status = String(values.studentStatus || 'WAITING')
              const filtered = list.filter((item) => {
                if (name && !item.name.includes(name)) return false
                if (item.studentStatus !== status) return false
                if (values.gender && item.gender !== values.gender) return false
                if (values.ownerName && item.ownerName !== values.ownerName) return false
                return true
              })
              if (!filtered.length) {
                message.warning('当前查询条件下没有可导出的数据')
                return
              }
              exportCsv(
                '报到名单',
                ['姓名', '电话', '性别', '计划入学', '到校行程', '床位', '报到状态', '归属顾问'],
                filtered.map((row) => [
                  row.name,
                  row.phone,
                  row.gender === 'MALE' ? '男' : row.gender === 'FEMALE' ? '女' : '',
                  row.planJoinDate || '',
                  travelText(row),
                  row.bedLabel || '未分配',
                  row.studentStatus === 'ENROLLED' ? '已报到' : '待报到',
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
        const list = await listCheckins()
        const name = String(params.name || '').trim()
        const status = String(params.studentStatus || 'WAITING')
        const filtered = list.filter((item) => {
          if (name && !item.name.includes(name)) return false
          if (item.studentStatus !== status) return false
          if (params.gender && item.gender !== params.gender) return false
          if (params.ownerName && item.ownerName !== params.ownerName) return false
          return true
        })
        return { data: filtered, success: true, total: filtered.length }
      }}
    />
  )
}
