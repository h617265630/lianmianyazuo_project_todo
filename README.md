# 连绵雅座 · 个人项目工作台

一个轻量的本地优先工作台，把散落在桌面上的**项目、待办与资料**收进一座安静的雅座，一处安放，一目了然。

> 数据全部存在浏览器 `localStorage`，无后端，无远端依赖。

## 技术栈

沿用 path 项目 (vue-frontend) 的同一套栈：

- **Vue 3** + **Vite** + **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Pinia** 状态管理
- **Vue Router** 路由
- **lucide-vue-next** 图标
- 自建 UI 组件 (`ProgressBar` / `StatusBadge` / `Modal`)

设计语言参照 path 项目的「暖色编辑风」：stone / amber 调色板、衬线大标题、克制留白。

## 启动

```bash
cd /Users/burn/Desktop/连绵雅座
npm install
npm run dev
```

打开 <http://localhost:5173> 即可。

## 功能页面

| 路由 | 说明 |
| --- | --- |
| `/` | 概览 — 当日问候、统计、Top 3 项目、最近 todo / 资料 |
| `/projects` | 项目工作区 — 全部项目列表，按状态 / 关键字筛选 |
| `/projects/:id` | 项目详情 — 进度、节点、条件、瓶颈、相关资料、学到的关键知识、本地路径、日志 |
| `/todos` | 待办 — 按项目分组，可新建 / 切换状态 / 删除 |
| `/resources` | 资料库 — 按项目归类 + 关键字 / 类型 / 标签 / 状态筛选 |

## 项目结构

```
连绵雅座/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── postcss.config.js
└── src/
    ├── main.ts
    ├── App.vue
    ├── style.css           # Tailwind v4 + 主题变量 + 自定义类
    ├── router.ts
    ├── env.d.ts
    ├── components/
    │   ├── NavBar.vue      # 顶栏 + 项目下拉
    │   ├── AppFooter.vue
    │   └── ui/
    │       ├── ProgressBar.vue
    │       ├── StatusBadge.vue
    │       └── Modal.vue
    ├── pages/
    │   ├── Home.vue
    │   ├── Projects.vue
    │   ├── ProjectDetail.vue
    │   ├── Todos.vue
    │   └── Resources.vue
    ├── stores/
    │   ├── projects.ts
    │   ├── todos.ts
    │   └── resources.ts
    ├── data/seed.ts        # 初始示例数据
    ├── types/index.ts
    └── utils/format.ts
```

## 数据

所有项目 / todo / 资料都保存在浏览器 `localStorage`，键：

- `lianmian.projects.v1`
- `lianmian.todos.v1`
- `lianmian.resources.v1`

清空浏览器缓存即可回到初始 seed 数据。