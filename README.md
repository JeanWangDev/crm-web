# crm-web

摄影培训机构顾问学员管理系统 · 管理后台

技术栈：React + Vite + TypeScript + **Ant Design 5** + **@ant-design/pro-components** + React Router + Axios  
登录页：基于 [katavii/animated-login](https://github.com/katavii/animated-login) / BugShare 趣味动画登录（GSAP）

## 启动

先启动后端 `crm-api`（8080），再：

```bash
cd crm-web
npm install
npm run dev
```

打开 http://127.0.0.1:5174 ，`/api` 已代理到后端。

## 目录

```
src/
  api/                         接口封装
  components/AnimatedCharacters  登录页动画角色
  layout/AppLayout.tsx           ProLayout 后台壳
  pages/
    LoginPage.tsx                animated-login 登录
    LeadsPage.tsx                ProTable 线索列表
    StudentsPage.tsx / Pickup / Dorms
  auth.tsx
```

演示账号：顾问 `13800000001` / 管理员 `13800000000`，密码 `123456`
