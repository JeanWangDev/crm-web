import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { ModalForm, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components'
import { Button, Tag, message } from 'antd'
import { useRef } from 'react'
import { createUser, listUsers, resetUserPassword, setUserEnabled, type Staff } from '../api/users'

export function AccountsPage() {
  const actionRef = useRef<ActionType>(null)
  const columns: ProColumns<Staff>[] = [
    { title: '账号', dataIndex: 'account' },
    { title: '姓名', dataIndex: 'name' },
    { title: '手机号', dataIndex: 'phone', search: false, render: (_, row) => row.phone || '-' },
    {
      title: '角色',
      dataIndex: 'role',
      valueType: 'select',
      valueEnum: { ADMIN: { text: '管理员' }, ADVISOR: { text: '顾问' } },
      render: (_, row) => (row.role === 'ADMIN' ? '管理员' : '顾问'),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueType: 'select',
      valueEnum: { true: { text: '启用' }, false: { text: '停用' } },
      render: (_, row) => <Tag color={row.enabled ? 'success' : 'default'}>{row.enabled ? '启用' : '停用'}</Tag>,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      render: (_, row) => [
        <ModalForm
          key="password"
          title={`重置 ${row.account} 的密码`}
          trigger={<a>重置密码</a>}
          modalProps={{ destroyOnClose: true }}
          onFinish={async (values) => {
            await resetUserPassword(row.id, String(values.password))
            message.success('密码已重置')
            return true
          }}
        >
          <ProFormText.Password name="password" label="新密码" rules={[{ required: true, min: 6, message: '至少 6 位' }]} />
        </ModalForm>,
        <a
          key="enabled"
          onClick={async () => {
            await setUserEnabled(row.id, !row.enabled)
            message.success(row.enabled ? '已停用' : '已启用')
            actionRef.current?.reload()
          }}
        >
          {row.enabled ? '停用' : '启用'}
        </a>,
      ],
    },
  ]

  return (
    <ProTable<Staff>
      headerTitle="账号管理"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      cardBordered
      search={{ labelWidth: 'auto' }}
      options={{ reload: true, density: true, setting: true }}
      toolBarRender={() => [
        <ModalForm
          key="add"
          title="新增账号"
          trigger={<Button type="primary">新增账号</Button>}
          modalProps={{ destroyOnClose: true }}
          initialValues={{ role: 'ADVISOR' }}
          onFinish={async (values) => {
            await createUser({
              account: String(values.account),
              name: String(values.name),
              phone: values.phone ? String(values.phone) : undefined,
              password: String(values.password),
              role: values.role === 'ADMIN' ? 'ADMIN' : 'ADVISOR',
            })
            message.success('账号已添加，对方可以用这个账号登录')
            actionRef.current?.reload()
            return true
          }}
        >
          <ProFormText name="account" label="登录账号" rules={[{ required: true, message: '请填写账号' }]} placeholder="如 wangmin" />
          <ProFormText name="name" label="姓名" rules={[{ required: true, message: '请填写姓名' }]} />
          <ProFormText name="phone" label="手机号" />
          <ProFormSelect
            name="role"
            label="角色"
            rules={[{ required: true }]}
            options={[
              { value: 'ADVISOR', label: '顾问' },
              { value: 'ADMIN', label: '管理员' },
            ]}
          />
          <ProFormText.Password name="password" label="初始密码" rules={[{ required: true, min: 6, message: '至少 6 位' }]} />
        </ModalForm>,
      ]}
      request={async (params) => {
        const list = await listUsers()
        const account = String(params.account || '').trim()
        const name = String(params.name || '').trim()
        const filtered = list.filter((item) => {
          if (account && !item.account.includes(account)) return false
          if (name && !item.name.includes(name)) return false
          if (params.role && item.role !== params.role) return false
          if (params.enabled === 'true' && !item.enabled) return false
          if (params.enabled === 'false' && item.enabled) return false
          return true
        })
        return { data: filtered, success: true, total: filtered.length }
      }}
    />
  )
}
