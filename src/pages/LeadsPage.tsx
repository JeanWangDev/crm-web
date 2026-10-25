import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components'
import {
  DrawerForm,
  ModalForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { Button, Descriptions, Drawer, Modal, Space, Tag, Timeline, Upload, message } from 'antd'
import dayjs from 'dayjs'
import { useRef, useState } from 'react'
import { useAuth } from '../auth'
import {
  addLeadFollowup,
  changeLeadStatus,
  convertLead,
  createLead,
  importLeads,
  leadDetail,
  listLeads,
  updateLead,
  type Followup,
  type Lead,
} from '../api/leads'
import { listUsers } from '../api/users'
import { exportCsv } from '../utils/exportCsv'
import { downloadLeadImportTemplate, parseLeadImportFile } from '../utils/leadImport'

const STATUS: Record<Lead['status'], { color: string; text: string }> = {
  PENDING: { color: 'magenta', text: '待联系' },
  FOLLOWING: { color: 'processing', text: '跟进中' },
  DROPPED: { color: 'default', text: '无意向' },
  CONVERTED: { color: 'success', text: '已成交' },
}

const SOURCE_OPTIONS = [
  { value: '运营分配', label: '运营分配' },
  { value: '广告', label: '广告' },
  { value: '其他', label: '其他' },
]

function filterLeads(
  list: Lead[],
  params: {
    studentName?: string
    studentPhone?: string
    wechat?: string
    source?: string
    status?: string
    ownerId?: number | string
  },
) {
  const keyword = String(params.studentName || '').trim()
  const phone = String(params.studentPhone || '').trim()
  const wechat = String(params.wechat || '').trim()
  return list.filter((item) => {
    if (keyword && !item.studentName.includes(keyword)) return false
    if (phone && !item.studentPhone.includes(phone)) return false
    if (wechat && !(item.wechat || '').includes(wechat)) return false
    if (params.source && item.source !== params.source) return false
    if (params.status && item.status !== params.status) return false
    if (params.ownerId && item.ownerId !== Number(params.ownerId)) return false
    return true
  })
}

function exportLeadsCsv(rows: Lead[]) {
  exportCsv(
    '意向线索',
    ['姓名', '电话', '微信号', '来源', '状态', '归属顾问', '创建人', '更新人', '创建时间', '更新时间', '备注'],
    rows.map((row) => [
      row.studentName,
      row.studentPhone,
      row.wechat || '',
      row.source || '',
      STATUS[row.status]?.text || row.status,
      row.ownerName || '',
      row.createdByName || '',
      row.updatedByName || '',
      row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
      row.updatedAt ? dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '',
      row.remark || '',
    ]),
  )
}

export function LeadsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const actionRef = useRef<ActionType>(null)
  const formRef = useRef<ProFormInstance>(undefined)
  const [current, setCurrent] = useState<Lead>()
  const [followups, setFollowups] = useState<Followup[]>([])
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  async function show(row: Lead) {
    const detail = await leadDetail(row.id)
    setCurrent(detail.lead)
    setFollowups(detail.followups)
    setOpen(true)
  }

  const columns: ProColumns<Lead>[] = [
    { title: '姓名', dataIndex: 'studentName', copyable: true, ellipsis: true },
    { title: '电话', dataIndex: 'studentPhone', copyable: true, width: 130 },
    { title: '微信号', dataIndex: 'wechat', copyable: true, ellipsis: true, width: 120 },
    {
      title: '来源',
      dataIndex: 'source',
      valueType: 'select',
      valueEnum: { 运营分配: { text: '运营分配' }, 广告: { text: '广告' }, 其他: { text: '其他' } },
      width: 110,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        PENDING: { text: '待联系', status: 'Warning' },
        FOLLOWING: { text: '跟进中', status: 'Processing' },
        DROPPED: { text: '无意向', status: 'Default' },
        CONVERTED: { text: '已成交', status: 'Success' },
      },
      render: (_, row) => <Tag color={STATUS[row.status].color}>{STATUS[row.status].text}</Tag>,
      width: 100,
    },
    {
      title: '归属顾问',
      dataIndex: 'ownerId',
      valueType: 'select',
      width: 110,
      hideInSearch: !isAdmin,
      fieldProps: { showSearch: true, allowClear: true, optionFilterProp: 'label' },
      request: async () => (await listUsers()).map((item) => ({ label: item.name, value: item.id })),
      render: (_, row) => row.ownerName || '-',
    },
    {
      title: '创建人',
      dataIndex: 'createdByName',
      search: false,
      width: 100,
      render: (_, row) => row.createdByName || row.ownerName || '-',
    },
    {
      title: '更新人',
      dataIndex: 'updatedByName',
      search: false,
      width: 100,
      render: (_, row) => row.updatedByName || row.ownerName || '-',
    },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime', search: false, width: 170 },
    { title: '更新时间', dataIndex: 'updatedAt', valueType: 'dateTime', search: false, width: 170 },
    { title: '备注', dataIndex: 'remark', ellipsis: true, search: false },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, row) => [
        <a key="detail" onClick={() => void show(row)}>
          详情
        </a>,
        <a key="follow" onClick={() => void show(row)}>
          跟进
        </a>,
        row.status !== 'CONVERTED' ? (
          <ModalForm
            key="edit"
            title="编辑线索"
            trigger={<a>编辑</a>}
            modalProps={{ destroyOnClose: true }}
            initialValues={{
              studentName: row.studentName,
              studentPhone: row.studentPhone,
              wechat: row.wechat,
              source: row.source || '运营分配',
              remark: row.remark,
            }}
            onFinish={async (values) => {
              await updateLead(row.id, {
                studentName: String(values.studentName || ''),
                studentPhone: String(values.studentPhone || ''),
                wechat: values.wechat ? String(values.wechat) : undefined,
                source: values.source ? String(values.source) : undefined,
                remark: values.remark ? String(values.remark) : undefined,
              })
              message.success('已保存')
              actionRef.current?.reload()
              return true
            }}
          >
            <ProFormText name="studentName" label="学员姓名" rules={[{ required: true, message: '请填写姓名' }]} />
            <ProFormText name="studentPhone" label="学员电话" rules={[{ required: true, message: '请填写电话' }]} />
            <ProFormText name="wechat" label="微信号" placeholder="选填" />
            <ProFormSelect name="source" label="信息来源" options={SOURCE_OPTIONS} />
            <ProFormTextArea name="remark" label="备注" fieldProps={{ rows: 3 }} />
          </ModalForm>
        ) : null,
      ],
    },
  ]

  return (
    <>
      <ProTable<Lead>
        headerTitle="学员意向线索"
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1600 }}
        cardBordered
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        dateFormatter="string"
        toolBarRender={() => [
          <Button key="tpl" onClick={() => downloadLeadImportTemplate()}>
            下载导入模板
          </Button>,
          <Upload
            key="import"
            accept=".xlsx,.xls,.csv"
            showUploadList={false}
            beforeUpload={async (file) => {
              setImporting(true)
              try {
                const rows = await parseLeadImportFile(file)
                const result = await importLeads(rows)
                actionRef.current?.reload()
                if (result.failed === 0) {
                  message.success(`导入成功 ${result.success} 条`)
                } else {
                  Modal.warning({
                    title: `成功 ${result.success} 条，失败 ${result.failed} 条`,
                    width: 560,
                    content: (
                      <div style={{ maxHeight: 280, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                        {(result.errors || []).slice(0, 30).join('\n')}
                        {(result.errors || []).length > 30 ? '\n…' : ''}
                      </div>
                    ),
                  })
                }
              } catch (error) {
                const detail = error instanceof Error ? error.message : '导入失败'
                message.error(detail)
              } finally {
                setImporting(false)
              }
              return false
            }}
          >
            <Button loading={importing}>导入 Excel</Button>
          </Upload>,
          <Button
            key="export"
            loading={exporting}
            onClick={async () => {
              setExporting(true)
              try {
                const list = await listLeads()
                const values = formRef.current?.getFieldsValue?.() || {}
                const filtered = filterLeads(list, values)
                if (!filtered.length) {
                  message.warning('当前查询条件下没有可导出的数据')
                  return
                }
                exportLeadsCsv(filtered)
                message.success(`已导出 ${filtered.length} 条`)
              } finally {
                setExporting(false)
              }
            }}
          >
            导出信息
          </Button>,
          <ModalForm
            key="create"
            title="新建线索"
            trigger={<Button type="primary">新建线索</Button>}
            modalProps={{ destroyOnClose: true }}
            initialValues={{ source: '运营分配' }}
            onFinish={async (values) => {
              await createLead({
                studentName: String(values.studentName || ''),
                studentPhone: String(values.studentPhone || ''),
                wechat: values.wechat ? String(values.wechat) : undefined,
                source: values.source ? String(values.source) : undefined,
                remark: values.remark ? String(values.remark) : undefined,
              })
              message.success('已新建线索')
              actionRef.current?.reload()
              return true
            }}
          >
            <ProFormText name="studentName" label="学员姓名" rules={[{ required: true, message: '请填写姓名' }]} />
            <ProFormText name="studentPhone" label="学员电话" rules={[{ required: true, message: '请填写电话' }]} />
            <ProFormText name="wechat" label="微信号" placeholder="选填" />
            <ProFormSelect name="source" label="信息来源" options={SOURCE_OPTIONS} />
            <ProFormTextArea name="remark" label="备注" fieldProps={{ rows: 3 }} />
          </ModalForm>,
        ]}
        request={async (params) => {
          const list = await listLeads()
          const filtered = filterLeads(list, params as Parameters<typeof filterLeads>[1])
          const currentPage = params.current || 1
          const pageSize = params.pageSize || 10
          const start = (currentPage - 1) * pageSize
          return { data: filtered.slice(start, start + pageSize), success: true, total: filtered.length }
        }}
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
      />

      <Drawer title="线索详情" width={560} open={open} onClose={() => setOpen(false)} destroyOnClose>
        {current && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="姓名">{current.studentName}</Descriptions.Item>
              <Descriptions.Item label="电话">{current.studentPhone}</Descriptions.Item>
              <Descriptions.Item label="微信号">{current.wechat || '-'}</Descriptions.Item>
              <Descriptions.Item label="来源">{current.source || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS[current.status].color}>{STATUS[current.status].text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="归属">{current.ownerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{current.createdByName || current.ownerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="更新人">{current.updatedByName || current.ownerName || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {current.createdAt ? dayjs(current.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {current.updatedAt ? dayjs(current.updatedAt).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注">{current.remark || '-'}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16 }} wrap>
              {current.status !== 'CONVERTED' && current.status !== 'DROPPED' && (
                <Button
                  onClick={async () => {
                    await changeLeadStatus(current.id, 'DROPPED')
                    message.success('已标记无意向')
                    setOpen(false)
                    actionRef.current?.reload()
                  }}
                >
                  无意向放弃
                </Button>
              )}
              {current.status === 'DROPPED' && (
                <Button
                  onClick={async () => {
                    await changeLeadStatus(current.id, 'FOLLOWING')
                    message.success('已恢复跟进')
                    setOpen(false)
                    actionRef.current?.reload()
                  }}
                >
                  恢复跟进
                </Button>
              )}
              {current.status !== 'CONVERTED' && current.status !== 'DROPPED' && (
                <DrawerForm
                  title="交钱后转正式学员"
                  trigger={<Button type="primary">交钱转学员</Button>}
                  drawerProps={{ destroyOnClose: true }}
                  initialValues={{
                    name: current.studentName,
                    phone: current.studentPhone,
                  }}
                  onFinish={async (values) => {
                    await convertLead(current.id, {
                      name: String(values.name || ''),
                      phone: String(values.phone || ''),
                      gender: values.gender as 'MALE' | 'FEMALE',
                      homeAddress: String(values.homeAddress || ''),
                      emergencyName: String(values.emergencyName || ''),
                      emergencyPhone: String(values.emergencyPhone || ''),
                      planJoinDate: dayjs(values.planJoinDate as string).format('YYYY-MM-DD'),
                    })
                    message.success('已录入正式学员和计划入学时间，可去接站看板登记怎么来')
                    setOpen(false)
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
                  <ProFormDatePicker
                    name="planJoinDate"
                    label="计划入学日期"
                    rules={[{ required: true, message: '交钱后请填写计划入学时间' }]}
                    extra="意向线索交钱后，在这里录入正式学员和计划来上学的日期"
                  />
                </DrawerForm>
              )}
            </Space>
            <DrawerForm
              title="写跟进"
              trigger={
                <Button style={{ marginTop: 16 }} disabled={current.status === 'CONVERTED'}>
                  写跟进
                </Button>
              }
              onFinish={async (values) => {
                await addLeadFollowup(current.id, String(values.content || ''))
                const detail = await leadDetail(current.id)
                setCurrent(detail.lead)
                setFollowups(detail.followups)
                message.success('跟进已保存')
                actionRef.current?.reload()
                return true
              }}
            >
              <ProFormTextArea name="content" label="跟进内容" rules={[{ required: true }]} fieldProps={{ rows: 4 }} />
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
