import {
  BankOutlined,
  CarOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ProSettings } from '@ant-design/pro-components'
import { PageContainer, ProLayout } from '@ant-design/pro-components'
import { Dropdown } from 'antd'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { FocusLogo, ORG_NAME } from '../brand/FocusLogo'

function menu(isAdmin: boolean) {
  const routes: Array<{ path: string; name: string; icon?: ReactNode; routes?: { path: string; name: string }[] }> = [
    { path: '/', name: '工作台', icon: <DashboardOutlined /> },
    {
      path: '/enroll',
      name: '招生管理',
      icon: <TeamOutlined />,
      routes: [{ path: '/leads', name: '意向线索' }],
    },
    {
      path: '/arrival',
      name: '报到管理',
      icon: <CarOutlined />,
      routes: [
        { path: '/checkins', name: '报到名单' },
        { path: '/pickup', name: '接站看板' },
      ],
    },
    {
      path: '/archive',
      name: '学员管理',
      icon: <UserOutlined />,
      routes: [{ path: '/students', name: '学员档案' }],
    },
    {
      path: '/housing',
      name: '宿舍管理',
      icon: <BankOutlined />,
      routes: [
        { path: '/housing/assign', name: '床位分配' },
        { path: '/housing/places', name: '宿舍地点（结构）' },
        { path: '/housing/buildings', name: '楼栋（结构）' },
        { path: '/housing/floors', name: '楼层（结构）' },
        { path: '/housing/rooms', name: '房间（结构）' },
        { path: '/housing/beds', name: '床位（结构）' },
      ],
    },
  ]
  if (isAdmin) {
    routes.push({
      path: '/system',
      name: '系统管理',
      icon: <SettingOutlined />,
      routes: [{ path: '/system/accounts', name: '账号管理' }],
    })
  }
  return { path: '/', routes }
}

function pageName(pathname: string, isAdmin: boolean) {
  if (pathname === '/') return '工作台'
  for (const group of menu(isAdmin).routes) {
    const children = 'routes' in group ? group.routes : undefined
    const hit = children?.find((item) => item.path === pathname)
    if (hit) return `${group.name} / ${hit.name}`
  }
  return '工作台'
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [settings] = useState<Partial<ProSettings>>({
    fixSiderbar: true,
    layout: 'mix',
    splitMenus: false,
    navTheme: 'light',
    contentWidth: 'Fluid',
    colorPrimary: '#1677ff',
  })

  const route = useMemo(() => menu(user?.role === 'ADMIN'), [user?.role])

  const titleExtra = useMemo(
    () => (user?.role === 'ADMIN' ? '管理员' : '顾问'),
    [user?.role],
  )

  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <ProLayout
        title={ORG_NAME}
        logo={<FocusLogo size={28} />}
        location={location}
        route={route}
        {...settings}
        menuItemRender={(item, dom) => {
          if (!item.path || item.path === '/enroll' || item.path === '/arrival' || item.path === '/archive' || item.path === '/housing' || item.path === '/system') {
            return dom
          }
          return <Link to={item.path}>{dom}</Link>
        }}
        avatarProps={{
          size: 'small',
          title: `${user?.name || ''}（${titleExtra}）`,
          render: (_props, dom) => (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: '退出登录',
                    onClick: () => {
                      logout()
                      navigate('/login')
                    },
                  },
                ],
              }}
            >
              {dom}
            </Dropdown>
          ),
        }}
        actionsRender={() => [
          <span key="phone" style={{ color: 'rgba(0,0,0,.45)', fontSize: 13 }}>
            {user?.account || user?.phone}
          </span>,
        ]}
        token={{
          header: {
            colorBgHeader: '#ffffff',
          },
          sider: {
            colorMenuBackground: '#ffffff',
          },
        }}
      >
        <PageContainer
          title={false}
          breadcrumb={{
            items: [
              { title: ORG_NAME },
              {
                title: pageName(location.pathname, user?.role === 'ADMIN'),
              },
            ],
          }}
        >
          <Outlet />
        </PageContainer>
      </ProLayout>
    </div>
  )
}
