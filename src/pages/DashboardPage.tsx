import { ProCard, StatisticCard } from '@ant-design/pro-components'
import { Col, Row, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { listLeads } from '../api/leads'
import { listPickups } from '../api/pickups'
import { listStudents } from '../api/students'
import { listCheckins } from '../api/checkins'

export function DashboardPage() {
  const [leadTotal, setLeadTotal] = useState(0)
  const [pending, setPending] = useState(0)
  const [following, setFollowing] = useState(0)
  const [todayPickup, setTodayPickup] = useState(0)
  const [students, setStudents] = useState(0)
  const [waitCheckin, setWaitCheckin] = useState(0)

  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD')
    void listLeads().then((list) => {
      setLeadTotal(list.length)
      setPending(list.filter((item) => item.status === 'PENDING').length)
      setFollowing(list.filter((item) => item.status === 'FOLLOWING').length)
    })
    void listStudents().then((list) => setStudents(list.length))
    void listPickups({ from: today, to: today }).then((list) => {
      setTodayPickup(list.filter((item) => item.pickupStatus === 'WAITING').length)
    })
    void listCheckins().then((list) => {
      setWaitCheckin(list.filter((item) => item.studentStatus !== 'ENROLLED').length)
    })
  }, [])

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        工作台
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        线索跟进 → 交钱转学员 → 登记行程/接站 → 床位分配 → 报到确认
      </Typography.Paragraph>

      <StatisticCard.Group direction="row" style={{ marginBottom: 16 }}>
        <StatisticCard statistic={{ title: '线索总数', value: leadTotal }} />
        <StatisticCard statistic={{ title: '待联系', value: pending }} />
        <StatisticCard statistic={{ title: '跟进中', value: following }} />
        <StatisticCard statistic={{ title: '正式学员', value: students }} />
        <StatisticCard statistic={{ title: '今日待接站', value: todayPickup }} />
        <StatisticCard statistic={{ title: '待报到', value: waitCheckin }} />
      </StatisticCard.Group>

      <Row gutter={[16, 16]}>
        {[
          { title: '意向线索', desc: '跟进；交钱后转学员并填计划入学', to: '/leads' },
          { title: '接站看板', desc: '登记来校方式，标记已接到', to: '/pickup' },
          { title: '床位分配', desc: '给待报到学员分床', to: '/housing/assign' },
          { title: '报到名单', desc: '确认待报到学员入校', to: '/checkins' },
          { title: '学员档案', desc: '报名信息、行程、在校跟进', to: '/students' },
        ].map((card) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={6} key={card.to}>
            <Link to={card.to}>
              <ProCard hoverable title={card.title} bordered>
                {card.desc}
              </ProCard>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  )
}
