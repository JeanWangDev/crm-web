import { AnimatedCharacters } from '../components/AnimatedCharacters'
import { Button, Form, Input, message, Space } from 'antd'
import { useState } from 'react'
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../auth'
import { FocusLogo, ORG_NAME } from '../brand/FocusLogo'
import styles from './login/index.module.css'

export function LoginPage() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const [showPassword, setShowPassword] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (values: { account: string; password: string }) => {
    setLoading(true)
    setError('')
    try {
      const data = await login(values.account, values.password)
      setSession(data.token, data.user)
      message.success(`欢迎回来，${data.user.name}`)
      navigate('/')
    } catch {
      setError('账号或密码有误，请重新输入')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.leftTop}>
          <div className={styles.brandMark}>
            <FocusLogo size={28} tone="light" />
          </div>
          <span className={styles.brandName}>{ORG_NAME}</span>
        </div>

        <div className={styles.charactersArea}>
          <AnimatedCharacters
            isTyping={isTyping}
            showPassword={showPassword}
            passwordLength={passwordValue.length}
          />
        </div>

        <div className={styles.leftFooter}>
          <a href="#">顾问端工作台</a>
          <a href="#">内部系统</a>
        </div>

        <div className={styles.decorBlur1} />
        <div className={styles.decorBlur2} />
        <div className={styles.decorGrid} />
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.mobileLogo}>
            <div className={styles.mobileLogoIcon}>
              <FocusLogo size={20} />
            </div>
            <span>{ORG_NAME}</span>
          </div>

          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>登录到工作台</h1>
            <p className={styles.formSubtitle}>线索跟进 · 接站调度 · 宿舍分配</p>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
            className={styles.form}
          >
            <div className={styles.fieldLabel}>账号</div>
            <Form.Item name="account" rules={[{ required: true, message: '请输入账号' }]}>
              <Input
                prefix={<UserOutlined className={styles.prefixIcon} />}
                placeholder="输入登录账号"
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
              />
            </Form.Item>

            <div className={styles.fieldLabel}>密码</div>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度不能少于 6 个字符' },
              ]}
            >
              <Input
                prefix={<LockOutlined className={styles.prefixIcon} />}
                type={showPassword ? 'text' : 'password'}
                placeholder="输入登录密码"
                onChange={(e) => setPasswordValue(e.target.value)}
                suffix={
                  <span className={styles.eyeToggle} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  </span>
                }
              />
            </Form.Item>

            {error && <div className={styles.errorBox}>{error}</div>}

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading} block className={styles.submitBtn}>
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.divider}>
            <span>管理员</span>
          </div>

          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            <Button
              block
              className={styles.googleBtn}
              onClick={() => {
                form.setFieldsValue({ account: 'admin', password: '123456' })
                setPasswordValue('123456')
              }}
            >
              填入管理员账号 admin
            </Button>
          </Space>

          <div className={styles.signupRow}>
            暂无账号？ <span className={styles.signupLink}>联系管理员开通</span>
          </div>
        </div>
      </div>
    </div>
  )
}
