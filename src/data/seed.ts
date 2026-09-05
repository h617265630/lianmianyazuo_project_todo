import type { Project, Todo, ResourceItem, ResearchNote, Insight } from '../types'

export const seedProjects: Project[] = [
  {
    id: 'onepage-reader',
    name: '一页 · OnePage 电子墨水屏阅读器',
    tagline: '极致轻薄的电子墨水屏阅读硬件',
    description:
      '基于 ESP32-S3 + E-Ink 的超薄电子墨水屏阅读器，目标是单页切换、专注阅读体验的硬件开源项目。涵盖原理图、PCB、固件、外壳与云端同步的整体设计。',
    status: 'in-progress',
    phase: 'started',
    progress: 62,
    startDate: '2026-03-15',
    localPath: '/Users/burn/Desktop/onepage-reader',
    repoUrl: 'https://github.com/burn/onepage-reader',
    liveUrl: '',
    conditions: [
      '嘉立创免费打样券 (已消耗2/4)',
      'S3 核心板动态贴片图定稿',
      '锂电池 350mAh + 充放电管理芯片备料',
      '外壳 3D 打印 SLA 树脂 (嘉立创 / 自购)',
    ],
    bottlenecks: [
      'E-Ink 屏驱动 SPI 时序在低功耗模式下偶发掉线，需补充看门狗逻辑',
      '外壳超薄化导致天线净空不足，Wi-Fi 信号弱 6dB',
      'PCB 1.2mm 板厚下单板成本翻倍，需要重新评估',
    ],
    references: [
      'https://www.waveshare.com/wiki/12.48inch_e-Paper_Module',
      'esp32-s3-mini 官方 datasheet (rev 1.4)',
      '嘉立创 EDA Pro 元件库 → /Users/burn/Desktop/de-link-pcb-master',
      '《嵌入式低功耗设计》 Ch.6 — 墨水屏电源策略',
    ],
    learning: [
      'E-Ink 局部刷新与全局刷新的功耗/残影权衡',
      'ESP32-S3 的深度睡眠 + RTC 唤醒',
      'KiCad 4层板叠层设计 (信号 / 电源 / 地)',
      '锂电池充电曲线与温度补偿',
    ],
    milestones: [
      { title: '原理图 v0.1 评审通过', doneAt: '2026-04-02' },
      { title: 'PCB 1.6mm 板打样回来点亮', doneAt: '2026-05-18' },
      { title: '外壳 0.8mm 超薄试模', doneAt: '2026-07-09' },
    ],
    checkins: [
      { id: 'c1', date: '2026-08-26', note: '重新调整 E-Ink 驱动时序至 2.0MHz SPI，掉线频率下降 70%' },
      { id: 'c2', date: '2026-08-30', note: '外壳天线净空方案 A/B 双版本已开模，等回板测试' },
      { id: 'c3', date: '2026-09-01', note: '整理 GitHub README 与 BOM 表，准备下一版开源' },
    ],
    tags: ['硬件', '嵌入式', 'ESP32', 'E-Ink', '开源硬件'],
    objectives: [
      {
        id: 'o1',
        title: '做出可连续翻页 200 次的省电固件',
        keyResults: [
          { id: 'kr1', title: '局部刷新残影补偿算法落地', progress: 80 },
          { id: 'kr2', title: '整机待机功耗 < 200µA', progress: 50 },
        ],
      },
    ],
    accent: 'amber',
  },
  {
    id: 'bare-chip-lab',
    name: '动手裸芯片 · Bare Chip 实验室',
    tagline: '从一颗 MCU 芯片开始理解计算机',
    description:
      '拆解、烧录、跑通一颗裸芯片（无开发板）的全过程记录。结合电烙铁、Flyer 编程器与自制夹具，沉淀方法论文档。',
    status: 'in-progress',
    phase: 'started',
    progress: 35,
    startDate: '2026-06-01',
    localPath: '/Users/burn/Desktop/裸芯片',
    repoUrl: '',
    liveUrl: '',
    conditions: [
      'Flyer 编程器固件升级到最新版本',
      '自制 SOP-8 测试夹具 (3D 打印)',
      '一批 ATtiny84 / STM32G0 测试料',
    ],
    bottlenecks: [
      '裸芯片无晶振时如何保证 ISP 编程稳定性 (软件补偿 vs 硬件补晶振)',
      '自制夹具接触阻抗偏大，长时间运行发热',
    ],
    references: [
      'http://www.technoblogy.com/show?3AOH',
      'Microchip AVRISP mkII 用户手册',
      '/Users/burn/Desktop/动手裸芯片/方法论.md',
    ],
    learning: [
      'ISP / IAP / SWD 编程协议差异',
      '芯片裸片封装与 PCB 适配',
      '示波器触发在数字协议调试中的用法',
    ],
    milestones: [
      { title: 'ATtiny84 烧录成功', doneAt: '2026-06-20' },
      { title: '自制夹具 v1 跑通', doneAt: '2026-07-25' },
    ],
    checkins: [
      { id: 'c1', date: '2026-08-15', note: '尝试软件 RC 补偿裸片时钟，初步成功但偏差 ±3%' },
      { id: 'c2', date: '2026-08-28', note: '夹具改用镀金针，热阻下降明显' },
    ],
    tags: ['硬件', '方法论', '裸芯片', '嵌入式'],
    objectives: [
      {
        id: 'o2',
        title: '跑通一颗无开发板裸芯片的完整流程',
        keyResults: [
          { id: 'kr3', title: 'ISP 编程稳定性控制在 ±3% 内', progress: 60 },
          { id: 'kr4', title: '自制 SOP-8 夹具 v2 出图', progress: 30 },
        ],
      },
    ],
    accent: 'stone',
  },
  {
    id: 'myapp-todolist',
    name: 'V 的画线 · 网页涂鸦协作',
    tagline: '一个可以多人涂鸦的极简画板',
    description:
      '基于 Vue 3 + Canvas + WebSocket 的多人实时画线小工具，主打 30 秒上手 + 房间分享。',
    status: 'planning',
    phase: 'exploring',
    progress: 12,
    startDate: '2026-08-10',
    localPath: '/Users/burn/Desktop/V的画线',
    repoUrl: 'https://github.com/burn/v-draw',
    liveUrl: '',
    conditions: [
      'WebSocket 中转服务 (Node + ws)',
      '撤销 / 重做数据结构 (CRDT or 操作树)',
      '移动端触摸延迟优化方案',
    ],
    bottlenecks: [
      '低延迟同步和 CRDT 实现复杂度的取舍',
      '画板导出 SVG / PNG 的性能',
    ],
    references: [
      'https://github.com/yjs/yjs (CRDT 思路)',
      'MDN Canvas 性能优化笔记',
    ],
    learning: [
      'Canvas 2D 性能瓶颈与离屏渲染',
      'CRDT / OT 实时协作算法入门',
      'WebSocket 心跳与重连策略',
    ],
    milestones: [
      { title: '本地单用户画线 Demo', doneAt: '2026-08-12' },
    ],
    checkins: [
      { id: 'c1', date: '2026-08-22', note: '单用户画线 + 颜色切换已跑通，下一步接入 yjs' },
    ],
    tags: ['前端', '实时协作', 'Vue3', '画板'],
    objectives: [
      {
        id: 'o3',
        title: '上线一个可分享房间的多人画板',
        keyResults: [
          { id: 'kr5', title: 'yjs 双端同步跑通', progress: 10 },
          { id: 'kr6', title: '导出 SVG / PNG', progress: 0 },
        ],
      },
    ],
    accent: 'emerald',
  },
  {
    id: 'methodology-notes',
    name: '修仙式学习法 · 个人方法论',
    tagline: '把学习当成打怪升级',
    description:
      '把自学过程拆解成「读 → 复述 → 教 → 造 → 卖」五段式的个人方法论沉淀，包含模板、工具和案例库。',
    status: 'in-progress',
    phase: 'started',
    progress: 78,
    startDate: '2025-12-01',
    localPath: '/Users/burn/Desktop/修仙式学习法',
    repoUrl: '',
    liveUrl: '',
    conditions: [
      '整理过往学习案例 20+ 个',
      '沉淀 5 套可复用的复盘模板',
    ],
    bottlenecks: [
      '案例脱敏与隐私处理耗时',
      '方法论迁移到不同领域 (硬件 vs 软件) 的普适性',
    ],
    references: [
      '《学习之道》 Barbara Oakley',
      '《认知觉醒》 周岭',
      '/Users/burn/Desktop/方法论',
    ],
    learning: [
      '复盘与元认知训练',
      '知识卡片化与索引系统',
    ],
    milestones: [
      { title: '五段式 v1 文档完成', doneAt: '2026-02-10' },
      { title: '案例库 10 个', doneAt: '2026-05-30' },
    ],
    checkins: [
      { id: 'c1', date: '2026-08-20', note: '增加「教」环节的话术模板，效率提升明显' },
    ],
    tags: ['方法论', '个人成长', '学习'],
    objectives: [
      {
        id: 'o4',
        title: '沉淀 5 套可复用的复盘模板',
        keyResults: [
          { id: 'kr7', title: '整理 20 个脱敏案例', progress: 80 },
          { id: 'kr8', title: '写「教」环节话术模板', progress: 100 },
        ],
      },
    ],
    accent: 'stone',
  },
]

export const seedTodos: Todo[] = [
  {
    id: 't1',
    horizon: 'today',
    title: '整理一页阅读器外壳 A/B 方案测试报告',
    difficulty: 'hard',
    detail: '等外壳回板后记录信号强度、跌落测试与装配时间',
    projectId: 'onepage-reader',
    priority: 'high',
    status: 'doing',
    dueDate: '2026-09-08',
    createdAt: '2026-08-30',
  },
  {
    id: 't2',
    horizon: 'week',
    title: '裸芯片 SOP-8 夹具 v2 出图',
    difficulty: 'medium',
    detail: '镀金针 + 弹簧顶针方案，需要重新评估成本',
    projectId: 'bare-chip-lab',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-09-12',
    createdAt: '2026-09-01',
  },
  {
    id: 't3',
    horizon: 'month',
    title: '画板引入 yjs 替换 demo 中的本地状态',
    difficulty: 'hard',
    detail: '先在 demo 跑通两个客户端同步，再考虑服务端',
    projectId: 'myapp-todolist',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-09-20',
    createdAt: '2026-09-01',
  },
  {
    id: 't4',
    horizon: 'month',
    title: '本月方法论案例补齐 2 个',
    difficulty: 'easy',
    detail: '硬件 + 软件各 1，月底前完成',
    projectId: 'methodology-notes',
    priority: 'low',
    status: 'todo',
    dueDate: '2026-09-30',
    createdAt: '2026-08-28',
  },
  {
    id: 't5',
    horizon: 'week',
    title: '采购 E-Ink 备用屏片',
    difficulty: 'easy',
    detail: '12.48inch 与 10.3inch 各备一片',
    projectId: 'onepage-reader',
    priority: 'medium',
    status: 'done',
    createdAt: '2026-08-15',
  },
  {
    id: 't6',
    horizon: 'week',
    title: '整理裸芯片笔记到飞书云文档',
    difficulty: 'easy',
    detail: '同步做一份 PDF 备份',
    projectId: 'bare-chip-lab',
    priority: 'low',
    status: 'doing',
    createdAt: '2026-08-22',
  },
  {
    id: 't7',
    horizon: 'week',
    title: '整理天线净空 A/B 测试数据表',
    projectId: 'onepage-reader',
    parentId: 't1',
    priority: 'medium',
    difficulty: 'medium',
    status: 'todo',
    createdAt: '2026-09-02',
  },
]

export const seedResources: ResourceItem[] = [
  {
    id: 'r1',
    title: 'esp32-s3-mini Datasheet (rev 1.4)',
    kind: 'doc',
    projectId: 'onepage-reader',
    url: 'https://www.espressif.com/sites/default/files/documentation/esp32-s3-mini-1_datasheet.pdf',
    tags: ['ESP32', '硬件', 'datasheet'],
    summary: '一页阅读器核心芯片的官方文档，重点参考功耗与 GPIO 章节。',
    addedAt: '2026-08-12',
    status: 'read',
  },
  {
    id: 'r2',
    title: '《嵌入式低功耗设计》 第 6 章 — 墨水屏电源策略',
    kind: 'article',
    projectId: 'onepage-reader',
    tags: ['E-Ink', '低功耗', '电源'],
    summary: '系统讲解墨水屏在全局/局部刷新下的电源管理策略，与一页项目直接相关。',
    addedAt: '2026-08-18',
    status: 'reading',
  },
  {
    id: 'r3',
    title: 'Waveshare 12.48inch E-Paper Wiki',
    kind: 'doc',
    projectId: 'onepage-reader',
    url: 'https://www.waveshare.com/wiki/12.48inch_e-Paper_Module',
    tags: ['E-Ink', 'Waveshare'],
    summary: '微雪 12.48 寸屏的官方资料，含驱动板原理图与示例代码。',
    addedAt: '2026-08-05',
    status: 'read',
  },
  {
    id: 'r4',
    title: 'Technoblogy — Bare ATtiny Programming',
    kind: 'article',
    projectId: 'bare-chip-lab',
    url: 'http://www.technoblogy.com/show?3AOH',
    tags: ['裸芯片', 'AVR', 'ISP'],
    summary: 'David Cook-Jones 的裸芯片编程系列文章，方法论级的实践参考。',
    addedAt: '2026-07-01',
    status: 'read',
  },
  {
    id: 'r5',
    title: 'Microchip AVRISP mkII 用户手册',
    kind: 'doc',
    projectId: 'bare-chip-lab',
    tags: ['AVR', '编程器'],
    addedAt: '2026-06-22',
    status: 'read',
  },
  {
    id: 'r6',
    title: 'Yjs 官方文档',
    kind: 'tool',
    projectId: 'myapp-todolist',
    url: 'https://github.com/yjs/yjs',
    tags: ['CRDT', '协作', '实时'],
    summary: 'CRDT 实现 yjs，多人画板项目的核心依赖备选。',
    addedAt: '2026-08-22',
    status: 'unread',
  },
  {
    id: 'r7',
    title: 'MDN Canvas 性能优化笔记',
    kind: 'article',
    projectId: 'myapp-todolist',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas',
    tags: ['Canvas', '性能', '前端'],
    addedAt: '2026-08-20',
    status: 'reading',
  },
  {
    id: 'r8',
    title: '《学习之道》 Barbara Oakley',
    kind: 'book',
    projectId: 'methodology-notes',
    tags: ['学习', '方法论'],
    summary: 'Coursera 最受欢迎学习课主讲，专注/发散/惰性知识三段循环。',
    addedAt: '2026-01-10',
    status: 'read',
  },
  {
    id: 'r9',
    title: '《认知觉醒》 周岭',
    kind: 'book',
    projectId: 'methodology-notes',
    tags: ['学习', '方法论', '元认知'],
    summary: '从底层重塑学习与思考习惯的中文入门读物。',
    addedAt: '2026-02-04',
    status: 'read',
  },
  {
    id: 'r10',
    title: 'KiCad 官方 4 层板教程',
    kind: 'doc',
    projectId: 'onepage-reader',
    url: 'https://docs.kicad.org/',
    tags: ['KiCad', 'PCB', '4层板'],
    summary: '一页 PCB 叠层设计与阻抗控制的主要参考。',
    addedAt: '2026-04-21',
    status: 'read',
  },
  {
    id: 'r11',
    title: '嘉立创 EDA Pro 元件库迁移指南',
    kind: 'note',
    projectId: 'onepage-reader',
    tags: ['嘉立创', 'EDA', 'PCB'],
    summary: '从立创 EDA 迁到 Pro 的踩坑记录，本地同步 /Users/burn/Desktop/de-link-pcb-master。',
    addedAt: '2026-05-02',
    status: 'reading',
  },
  {
    id: 'r12',
    title: 'Tiny Tapeout — 开源芯片设计教程',
    kind: 'video',
    projectId: 'bare-chip-lab',
    url: 'https://tinytapeout.com/',
    tags: ['芯片设计', '开源硬件'],
    summary: '入门级开源芯片流片项目，适合拓展裸芯片认知到 ASIC。',
    addedAt: '2026-08-30',
    status: 'unread',
  },
]

export const seedResearch: ResearchNote[] = [
  {
    id: 'rn1',
    title: 'E-Ink 局部刷新的残影补偿策略',
    teaser:
      '对墨水屏而言，全局刷新耗电 ~25mAh，局部刷新只耗 ~2mAh，但会留下残影。',
    body: `墨水屏的「电泳」原理决定了每个像素只能在「黑 / 白 / 灰」之间被电场推动；推动得越彻底，残影越少，但耗时越长、能耗越大。

一页阅读器的目标是「连续翻页 200 次仍能保持一周续航」，这意味着我们必须依赖局部刷新 — 然后用软件策略去补残影。

## 几条经验

1. 同一区域连续局部刷新 > 5 次，强制做一次全刷清残影。
2. 不要在深色块大面积出现的位置用局部刷新，预先做 dithering。
3. 波形温度补偿：在 < 15°C 时刷新波形会自动加长，无法绕过 — 此时就别想着省电了。

## 还可以继续挖

- 单色 E-Ink 的波形文件结构与 LUT 改写
- 多区域异频刷新 (Partial + Partial 的并行)
- 第三方 Waveform 工具 vs 自研`,
    projectIds: ['onepage-reader'],
    tags: ['E-Ink', '低功耗', '显示'],
    stage: 'growing',
    createdAt: '2026-05-12',
    updatedAt: '2026-09-01',
  },
  {
    id: 'rn2',
    title: '裸芯片编程的三种时钟补偿思路',
    teaser:
      '没有外部晶振时，ATtiny84 内部 RC 振荡器 ±10% 偏差。是否值得用软件补？',
    body: `裸芯片烧录最大的难点在于 ISP 时序对时钟稳定性的硬要求 — 编程器会等一个稳定脉冲再下个命令。

AVR 的内振默认 8MHz 但偏差 ±10%，量产环境直接卡死 ISP。

## 思路 A：软件校准

写入 OSCCAL 寄存器做温度补偿。优点是不需要外部器件，缺点是补偿曲线是非线性的，要靠工厂校准。

## 思路 B：陶瓷谐振器

加一颗 50 cents 的陶瓷谐振器，立刻把精度拉回 ±2%。但破坏「全裸片」的纯粹性。

## 思路 C：编程器侧补偿

部分高级编程器支持 clock stretching / bit-banging，可以容忍偏差大的目标。这是 David Cook-Jones 在 Technoblogy 系列里反复强调的思路。

我目前更倾向 C — 因为它把复杂性留在了工具侧。`,
    projectIds: ['bare-chip-lab'],
    tags: ['裸芯片', 'AVR', '时钟'],
    stage: 'mature',
    createdAt: '2026-06-22',
    updatedAt: '2026-08-28',
  },
  {
    id: 'rn3',
    title: 'CRDT 入门：从 OT 到 Yjs',
    teaser:
      '多人协作的本质是合并并发修改 — CRDT 是当下最实用的答案。',
    body: `操作变换 (OT) 和 CRDT 都能解决并发冲突，但 CRDT 几乎垄断了现代方案 — 因为它不需要中心化协调。

## 关键概念

- **状态型 CRDT**：G-Counter、Pn-Counter、OR-Set，状态可交换可合并
- **操作型 CRDT**：CmRDT，交换的是操作本身
- **CRDT 框架**：Yjs、Automerge、Diamond Types

## Yjs 的取舍

Yjs 走的是「客户端最重、服务端最轻」的路线 — 客户端维护完整 CRDT 状态，服务端只负责转发和持久化。这对画板这种富文本 / 富结构场景是最佳匹配。

下一步：把 demo 里的本地状态换成 Yjs Doc，再加一个 y-websocket 服务即可。`,
    projectIds: ['myapp-todolist'],
    tags: ['CRDT', '协作', '前端'],
    stage: 'seedling',
    createdAt: '2026-08-25',
    updatedAt: '2026-09-01',
  },
  {
    id: 'rn4',
    title: '五段式学习法 — 为什么「教」最有效',
    teaser:
      '读、复述、教、造、卖 — 当你能教别人时，你才真正理解了。',
    body: `五段式是我从《学习之道》和一年多的实践中提炼出的方法 — 每一段都对应大脑的不同加工层次。

## 五段

1. **读** — 输入，建立基本图式。
2. **复述** — 用自己的话讲一遍，进入长时记忆。
3. **教** — 假设对象是个门外汉，必须用比喻和反例。
4. **造** — 在真实场景下造出点什么，验证理解。
5. **卖** — 卖给别人 / 写下来 / 发表 — 把外部反馈当成「逼自己再复述」的机制。

## 为什么「教」最关键

教是一种「不对称压力」：面对一个不懂的人，你不能跳过任何步骤。这是写给自己的笔记永远做不到的。`,
    projectIds: ['methodology-notes'],
    tags: ['方法论', '学习', '复盘'],
    stage: 'mature',
    createdAt: '2025-12-15',
    updatedAt: '2026-08-30',
  },
  {
    id: 'rn5',
    title: 'KiCad 4 层板叠层经验小结',
    teaser: '信号 / 地 / 电源 / 信号 — 不一定是最优，但通常是安全的默认。',
    body: `一页 PCB 的第一版用了 1.6mm 双面板，结果电源完整性很差。第二版换成 1.2mm 4 层板后噪声立刻降了一个量级。

## 推荐叠层

- L1: 信号 (顶层走线)
- L2: 完整地平面 (GND)
- L3: 电源平面 (3V3 / VBAT)
- L4: 信号 (底层走线，少量)

## 几个不要

- 不要在 L2 / L3 上走长信号线 — 它们是参考平面
- 不要让 L2 GND 平面被信号线切割成多个孤岛
- 高速信号 (USB / SDIO) 走 L1，参考 L2

阻抗控制通常 L1 / L4 用 0.2mm 厚 prepreg，加上 0.5mm 核心 + 0.5mm 核心 = 1.2mm 板厚，能稳定做出 50Ω 单端。`,
    projectIds: ['onepage-reader'],
    tags: ['PCB', 'KiCad', '硬件'],
    stage: 'growing',
    createdAt: '2026-04-18',
    updatedAt: '2026-07-15',
  },
]

export const seedInsights: Insight[] = [
  {
    id: 'i1',
    kind: 'method',
    title: 'E-Ink 局部刷新 + 强制全刷的阈值策略',
    body: '同一区域连续局部刷新超过 5 次就强制全刷一次，在残影和功耗之间取个平衡点。',
    projectId: 'onepage-reader',
    tags: ['E-Ink', '显示'],
    createdAt: '2026-08-20',
  },
  {
    id: 'i2',
    kind: 'insight',
    title: '把复杂度留在工具侧',
    body: '裸芯片编程里，用编程器补偿时钟，比给每颗芯片补器件更可持续——复杂性要沉淀到可复用的工具里。',
    projectId: 'bare-chip-lab',
    tags: ['方法论', '裸芯片'],
    createdAt: '2026-08-27',
  },
  {
    id: 'i3',
    kind: 'method',
    title: '教是最高强度的复述',
    body: '面对一个门外汉讲清楚，你不能跳过任何步骤——这是写给自己的笔记永远做不到的。',
    projectId: 'methodology-notes',
    tags: ['学习', '复盘'],
    createdAt: '2026-08-29',
  },
]