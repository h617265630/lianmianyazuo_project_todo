/* ============================================================
   一次性导入：把桌面上的 5 个真实项目写入数据库
   运行：`tsx server/db/import-desktop.ts`
   归属 demo 用户 (u-demo)；可重复执行（先按 id 清理再插入）。
   ============================================================ */
import { db } from './index'
import { projects, projectObjectives, projectKeyResults, todos } from './schema'
import { eq, inArray } from 'drizzle-orm'

const USER_ID = 'u-demo'
const TODAY = '2026-09-03'

type TodoSpec = {
  title: string
  priority: 'low' | 'medium' | 'high'
  difficulty: 'easy' | 'medium' | 'hard'
  status: 'todo' | 'doing' | 'done'
}
type KR = { title: string; progress: number }
type Obj = { title: string; keyResults: KR[] }
type Proj = {
  id: string
  name: string
  tagline: string
  description: string
  status: 'planning' | 'in-progress' | 'blocked' | 'completed' | 'archived'
  phase: 'started' | 'exploring'
  progress: number
  startDate: string
  localPath: string
  repoUrl?: string
  liveUrl?: string
  conditions: string[]
  bottlenecks: string[]
  references: string[]
  learning: string[]
  tags: string[]
  accent: 'amber' | 'stone' | 'emerald'
  objectives: Obj[]
  todos: TodoSpec[]
}

const PROJECTS: Proj[] = [
  {
    id: 'p-xiuxian',
    name: '修仙式学习法',
    tagline: '以修仙十境为隐喻，把学习与做项目变成循序渐进的修真之旅（Claude Skill）',
    description:
      '一个个人化的 Claude Skill：把「修仙」境界体系（炼气→筑基→金丹→元婴→化神→炼虚→合体→大乘→渡劫→仙人）借来做两件事——学习一门新学问（当作功法）和推进一个项目（当作修真之旅）。调用后输出境界路线图、每境的功法/丹药/试炼/心魔、进度追踪模板，以及项目场景下的宗门职务、灵宝清单、渡劫预案。',
    status: 'completed',
    phase: 'started',
    progress: 90,
    startDate: '2026-09-02',
    localPath: '/Users/burn/Desktop/修仙式学习法',
    conditions: [
      '需通过 install.sh 软链到 ~/.claude/skills/ 才能被 Claude Code 自动识别（安装脚本已存在但未见执行痕迹）',
      '非 git 仓库（无 .git），无版本历史与远端备份',
      'assets/ 目前仅修真速查卡一个文件，基本是占位',
      'examples/ 与 templates/ 为示意性内容，尚无真实用户跑通并回填进度的证据',
    ],
    bottlenecks: [
      '尚未在真实 Claude Code 会话中端到端验证 /修仙式学习法 的输出是否稳定',
      '无 git 仓库/远端，不便协作与版本管理',
      '内容为单人维护，示例中「法侣财地」的「侣」被标注为短板，框架落地依赖个人自律',
    ],
    references: [
      '/Users/burn/Desktop/修仙式学习法/SKILL.md',
      '/Users/burn/Desktop/修仙式学习法/README.md',
      '/Users/burn/Desktop/修仙式学习法/references/境界体系.md',
      '/Users/burn/Desktop/修仙式学习法/references/学习心法.md',
      '/Users/burn/Desktop/修仙式学习法/references/项目修仙.md',
      '/Users/burn/Desktop/修仙式学习法/install.sh',
    ],
    learning: [
      'Claude Skill 编写与打包（SKILL.md frontmatter、references/templates/examples 分层）',
      '结构化学习方法论设计（隐喻驱动的阶段划分：费曼技巧、Zettelkasten、刻意练习）',
      '个人知识管理（PKM）与进度追踪模板设计（修真档案、境界任务卡）',
      '项目管理框架（Shape Up、Team Topologies、里程碑式境界评审）',
    ],
    tags: ['修仙', 'learning-methodology', 'claude-skill', 'xianxia', 'pkm', 'self-improvement'],
    accent: 'emerald',
    objectives: [
      {
        title: '打磨成可被 Claude Code 直接调用的成熟 skill',
        keyResults: [
          { title: 'SKILL.md 主入口 + frontmatter 完整且可被识别', progress: 100 },
          { title: 'references/ 三份心法覆盖十境的功法/丹药/试炼/心魔', progress: 100 },
          { title: 'install.sh 一键安装脚本（user/project）可运行', progress: 100 },
        ],
      },
      {
        title: '让 skill 对真实用户可上手并产出学习/项目路线',
        keyResults: [
          { title: 'templates/ 四个落盘模板齐备（学习路径、项目修仙、任务卡、修真档案）', progress: 100 },
          { title: 'examples/ 覆盖学习(Three.js)与项目(一页墨水屏)两类示例', progress: 100 },
          { title: '在真实 Claude Code 会话中跑通 /修仙式学习法 调用', progress: 0 },
        ],
      },
      {
        title: '沉淀可传承的个人学习方法论体系',
        keyResults: [
          { title: '心魔总纲 + 修真四要素(法侣财地)映射成文', progress: 100 },
          { title: '对外分享并被他人复用', progress: 0 },
        ],
      },
    ],
    todos: [
      { title: '运行 install.sh 将 skill 软链到 ~/.claude/skills/ 并实测 /修仙式学习法 调用', priority: 'high', difficulty: 'easy', status: 'todo' },
      { title: 'git init 建立版本控制并提交初始版本（可选推送远端）', priority: 'medium', difficulty: 'easy', status: 'todo' },
      { title: '用 examples/学习示例.md 跑通一次真实「学 X」路径以验证输出规范', priority: 'high', difficulty: 'medium', status: 'todo' },
      { title: '补齐 assets/ 下的图示资源（当前仅修真速查卡一张）', priority: 'low', difficulty: 'easy', status: 'todo' },
      { title: '增加「法侣财地」自评工具，弥补示例中「侣」的短板', priority: 'medium', difficulty: 'medium', status: 'todo' },
      { title: '把 templates/修真档案.md 接入真实进度追踪并回填首条记录', priority: 'medium', difficulty: 'easy', status: 'todo' },
    ],
  },

  {
    id: 'p-huaxian',
    name: '一页 · 裸形片 (ESP32-S3)',
    tagline: '壹页·OnePage 裸形片 4 层 PCB — ESP32-S3R8 + 4.26" EPD',
    description:
      '一页阅读器的 ESP32-S3 裸形片硬件版本：KiCad 4 层 PCB，0805 封装 + 最简位号丝印。BOM 核心为 ESP32-S3R8、4.26 寸 EPD0426A02 墨水屏 FPC、USB-C、microSD、LiPo 充电(BQ24074)、40MHz 晶振与 16MB 闪存。已导出 JLC 打样/贴装所需生产文件（bom/positions/netlist/designators），最新提交"画完 准备下单"。',
    status: 'in-progress',
    phase: 'started',
    progress: 85,
    startDate: '2026-08-25',
    localPath: '/Users/burn/Desktop/我的画线',
    repoUrl: 'https://github.com/h617265630/epd_esp32-pcb.git',
    conditions: [
      '裸形片(ESP32-S3R8)4 层 PCB 版图与布线已完成，最新提交为"画完 准备下单"',
      'JLC 生产文件已生成：jlc分装/production 含 bom.csv、positions.csv、netlist.ipc、designators.csv 与 0805JLC.zip',
      'BOM 中绝大多数元件 LCSC Part # 一列为空，尚未完成 JLC 可贴装选型',
      '新迭代"一页v1"工程已建立（含"壹页·OnePage"子目录），但仍为空白骨架',
    ],
    bottlenecks: [
      'BOM 元件 LCSC 编号未补全，阻碍 JLC SMT 自动报价与下单',
      '一页v1 版原理图/版图仍为空白骨架，v1 重新设计刚起步',
      '仓库仅有 1 次 commit，版本历史依赖 KiCad 本地 .history 快照',
      'RF 调谐（1.5pF/12pF/24nH 等 tune 值）、充电电流与 DNP 元件(C19/R32)需回板后实测校准',
    ],
    references: [
      'https://github.com/h617265630/epd_esp32-pcb.git',
      '/Users/burn/Desktop/我的画线/jlc分装/production/bom.csv',
      '/Users/burn/Desktop/我的画线/jlc分装/production/positions.csv',
      '/Users/burn/Desktop/我的画线/jlc分装/bom/ibom.html',
    ],
    learning: [
      'KiCad 原理图与 4 层 PCB 版图/布线（ESP32-S3 + EPD 平台）',
      '电子墨水屏（EPD）驱动接口与 VGH/VGL/VCOM 电源轨设计',
      '锂电池充电管理（BQ24074）与电源树集成',
      'JLC PCB/SMT 可制造性（DFM）—— BOM、坐标、网表导出',
    ],
    tags: ['KiCad', 'PCB设计', 'e-ink', 'ESP32-S3', '硬件', 'JLC'],
    accent: 'stone',
    objectives: [
      {
        title: '完成裸形片(ESP32-S3R8)4 层 PCB 版图并导出 JLC 生产文件',
        keyResults: [
          { title: '4 层版图与布线完成', progress: 100 },
          { title: 'BOM/坐标/网表生产文件导出', progress: 100 },
        ],
      },
      {
        title: '完成 BOM 元件选型并满足 JLC 可贴装（LCSC 编号）',
        keyResults: [
          { title: '关键器件（MCU/电源/连接器）选定', progress: 70 },
          { title: '全表 LCSC 编号填充', progress: 10 },
        ],
      },
      {
        title: '推进"一页v1"超薄墨水屏阅读器新版本设计',
        keyResults: [
          { title: 'v1 工程与目录建立', progress: 20 },
          { title: 'v1 原理图/版图设计', progress: 0 },
        ],
      },
    ],
    todos: [
      { title: '补全 BOM 中 LCSC 元件编号并提交 JLC SMT 报价下单', priority: 'high', difficulty: 'medium', status: 'doing' },
      { title: '打样裸形片 PCB 并回板测试', priority: 'high', difficulty: 'easy', status: 'todo' },
      { title: '完成"一页v1"原理图与版图设计', priority: 'high', difficulty: 'hard', status: 'todo' },
      { title: '回板后校准 RF 调谐与充电电流（tune/DNP 元件）', priority: 'medium', difficulty: 'hard', status: 'todo' },
      { title: '整理关键版本并补交 git（当前仅 1 次 commit）', priority: 'low', difficulty: 'easy', status: 'todo' },
    ],
  },

  {
    id: 'p-microduck',
    name: 'Microduck',
    tagline: 'A tiny biped robot that moves using reinforcement learning policies.',
    description:
      'Microduck 是约 25 cm、800 g 的双足鸭形机器人，动作由强化学习策略驱动。本仓库是"鸭脑"：在 Rockchip RK3566（Radxa Zero 3W）上运行的 Rust workspace，包含 robotd（50 Hz 控制循环驱动 15 个舵机的 ONNX 神经网络策略 + 安全层）、updaterd（带签名/健康检查/可回滚的 OTA）、configd（wifi + 身份）、btd（BLE）、padd（手柄）、mediad（WebRTC 摄像头）、tofd（ToF 深度）、pet-detect（识别挠头的 ~20KB CNN）以及 robotctl/duckctl 操作员 CLI。所有服务以 JSON-RPC over Unix socket 通信。策略在 sibling microduck_rl（MuJoCo + PPO，sim2real）训练并导出 ONNX。Apache-2.0，workspace v0.10.0。',
    status: 'in-progress',
    phase: 'started',
    progress: 68,
    startDate: '2026-08-27',
    localPath: '/Users/burn/Desktop/microduck-main',
    repoUrl: 'https://github.com/pollen-robotics/microduck',
    liveUrl: 'https://pollen-robotics.com/microduck',
    conditions: [
      'Milestones M1–M3 完成，M4 接近收尾；workspace v0.10.0，本机 942 测试通过，CI/release/promote/dev workflow 全在跑',
      'LAN 内浏览器看摄像头流可用（硬件 H.264 via mpph264enc）；外网访问（rendezvous + TURN）刻意未实现',
      '恢复网（robot-boot-check + robot-rescue + golden symlink）已发布但未在真板上演练过',
      '自主脑（autonomous.rs 行为栈）未移植——最大缺口，仅有占位设计文档',
    ],
    bottlenecks: [
      '手机 app (#107) 设计了但没实现，堵在硬件 spike：真 iPhone/Android 的 BLE 扫描/连接/握手/认证',
      '隐私指示灯需要一颗软件可控的 LED，但当前硬件没有',
      'BLE 配对 PIN 必须从工厂流程（生成/打印/记录）来，不能靠代码 patch 解决——该流程尚未定义',
      'robotd 不能在 50 Hz 循环中热加载策略（无 SIGHUP / ONNX session 切换），阻塞 M8 模型通道',
    ],
    references: [
      'https://github.com/pollen-robotics/microduck',
      'https://github.com/pollen-robotics/microduck_rl',
      'https://pollen-robotics.com/microduck',
      '/Users/burn/Desktop/microduck-main/README.md',
      '/Users/burn/Desktop/microduck-main/docs/project/roadmap.md',
      '/Users/burn/Desktop/microduck-main/docs/design/architecture.md',
    ],
    learning: [
      'Rust 嵌入式/机器人 daemon 架构：基于统一 JSON-RPC over Unix socket 的 tokio 微服务',
      '设备端部署强化学习策略（ONNX Runtime dlopen、MuJoCo/PPO sim2real 导出）',
      '安全优先的 OTA：签名发布、健康门控原子切换、可回滚',
      '边缘媒体/NPU 适配：Rockchip RKNN、GStreamer mpph264enc/webrtcsink、WebRTC 推流',
    ],
    tags: ['rust', 'robotics', 'reinforcement-learning', 'embedded', 'ota-updates', 'onnx'],
    accent: 'amber',
    objectives: [
      {
        title: '打通模型通道（M8）让策略离开 daemon artifact',
        keyResults: [
          { title: 'robotd 增加 SIGHUP handler，热切 ONNX 策略不掉一帧', progress: 0 },
          { title: '在 microduck_rl 训练的策略发布到 HF Hub 并经 robotctl update apply model-walk 装/回滚', progress: 0 },
          { title: 'shape gate（obs[1,61] → actions[1,14]）在策略上线前拒绝不兼容模型', progress: 0 },
        ],
      },
      {
        title: '关掉 M5 媒体/SDK 传输——让远程可见',
        keyResults: [
          { title: 'LAN 内浏览器 WebRTC 推流 + 控制 datachannel', progress: 100 },
          { title: 'rendezvous + TURN 让外网也能连上机器人', progress: 0 },
          { title: 'SDK：服务端脚本几十行内取一帧并下发一个意图', progress: 0 },
        ],
      },
      {
        title: '达到可发货门槛（M6）让陌生人也能拥有鸭子',
        keyResults: [
          { title: '在板上演练"故意制造坏版"的恢复网', progress: 0 },
          { title: '手机 BLE spike（扫描/连/握手/认证）在真 iPhone/Android 上通过', progress: 0 },
          { title: 'mediad 支持按会话的流授权同意', progress: 0 },
        ],
      },
    ],
    todos: [
      { title: '决定 SDK 传输方式（WebSocket vs WebRTC）并实现 Python client', priority: 'high', difficulty: 'medium', status: 'todo' },
      { title: '给 robotd 加 SIGHUP handler，在 50 Hz 循环中热切 ONNX 策略', priority: 'high', difficulty: 'hard', status: 'todo' },
      { title: '在真 iPhone/Android 上跑手机 BLE spike', priority: 'high', difficulty: 'medium', status: 'todo' },
      { title: '在板上用"故意砖化"的发版演练恢复网', priority: 'medium', difficulty: 'medium', status: 'todo' },
      { title: 'mediad 落地按会话的流授权同意', priority: 'medium', difficulty: 'easy', status: 'todo' },
      { title: '定义工厂端配对 PIN 流程（生成/打印/记录）', priority: 'medium', difficulty: 'medium', status: 'todo' },
    ],
  },

  {
    id: 'p-yiyie',
    name: '一页 · OnePage (ESP32-C61)',
    tagline: 'Ultra-thin open-hardware e-ink reader built on ESP32-C61',
    description:
      'OnePage（壹页）是以 4.26" 800x480 墨水屏 + ESP32-C61（RISC-V）为核心的 DIY 开源电子阅读器生态，包含四部分：(1) CrossPoint Reader 固件移植（CJK 排版、BLE 翻页遥控、电源优化）；(2) 可生产的电子料（Altium 原理图/PCB、Gerbers、BOM、iBOM、贴片坐标）；(3) 结构件（PET/亚克力面板、CNC 中框、MakerWorld 3D 外壳）；(4) 浏览器辅助工具（Web Serial 烧录、cpfont 字体构建器、WASM 阅读器模拟器）。本地为 GitHub 项目快照 + 打样归档；硬件 V1（2026-08-19）与固件 v0.1.0 均已发布。',
    status: 'in-progress',
    phase: 'started',
    progress: 75,
    startDate: '2026-08-25',
    localPath: '/Users/burn/Desktop/一页',
    repoUrl: 'https://github.com/MoveCall/onepage-reader',
    liveUrl: 'https://movecall.github.io/onepage-reader-web/',
    conditions: [
      '固件烧录路径依赖板子 SPI-flash 厂商（Winbond vs Puya）——Puya 需要带 --no-stub 的慢速烧录',
      '本地源码是 zip 快照、无 .git 元数据，需要从 GitHub 重克隆以恢复版本历史与远端',
      '托管的 web flasher 只发布上游 X3/X4 固件；OnePage 用户必须本地自构 firmware.bin',
      '3D 可打印外壳模型只发布在 MakerWorld，未入仓',
    ],
    bottlenecks: [
      '实机验证依赖物理 ESP32-C61 板，纯软件无法测试',
      '浏览器内的 WASM 模拟器需要 cross-origin isolation（HTTPS），明文 HTTP LAN 跑不起来',
      '品牌名还没定——主仓链接在固件 README 里标为 TBD',
    ],
    references: [
      'https://github.com/MoveCall/onepage-reader',
      'https://github.com/MoveCall/crosspoint-onepage',
      'https://github.com/MoveCall/onepage-reader-web',
      'https://movecall.github.io/onepage-reader-web/',
      'https://oshwhub.com/movecall/project_ucjwpaya',
      'https://github.com/crosspoint-reader/crosspoint-reader',
      '/Users/burn/Desktop/一页/归档/mainboard/InteractiveBOM_PCB_OnePage_V1_2026-8-19.html',
    ],
    learning: [
      'ESP32-C61（RISC-V）嵌入式固件：PlatformIO / Arduino',
      '极受限内存优化（~380 KB RAM，单 e-ink framebuffer）',
      '墨水屏驱动、刷新/残影控制、CJK 字体子集化',
      'WebAssembly（FreeType + CrossPoint 模拟器）与 Web Serial 浏览器烧录',
    ],
    tags: ['e-ink', 'esp32-c61', 'open-hardware', 'embedded', 'firmware', 'wasm'],
    accent: 'stone',
    objectives: [
      {
        title: '发布可生产的 OnePage C61 电子料与外壳',
        keyResults: [
          { title: '原理图/PCB/Gerbers/贴片坐标完成', progress: 100 },
          { title: 'BOM 与交互式 iBOM 发布', progress: 100 },
          { title: '面板/CNC 中框/3D 外壳发布', progress: 90 },
        ],
      },
      {
        title: '把 CrossPoint 固件移植到 ESP32-C61',
        keyResults: [
          { title: 'v0.1.0 固件可编译可烧录', progress: 100 },
          { title: 'BLE 翻页遥控与电源优化落地', progress: 100 },
          { title: '查词功能发布', progress: 0 },
        ],
      },
      {
        title: '交付浏览器辅助工具',
        keyResults: [
          { title: '浏览器内 cpfont 字体构建器上线', progress: 90 },
          { title: 'Web Serial 烧录与阅读器模拟器上线', progress: 80 },
          { title: 'Build log 与中英双语站点发布到 GitHub Pages', progress: 90 },
        ],
      },
    ],
    todos: [
      { title: '从 GitHub 重克隆 onepage-reader 子模块，恢复 git 历史与远端', priority: 'high', difficulty: 'easy', status: 'todo' },
      { title: '编译并烧录 v0.1.0 固件到物理 C61 板，验证实机阅读', priority: 'high', difficulty: 'medium', status: 'todo' },
      { title: '为托管 web flasher 增加 OnePage 构建，免本地工具链', priority: 'medium', difficulty: 'medium', status: 'todo' },
      { title: '实现内联查词（当前标记为 coming soon）', priority: 'medium', difficulty: 'hard', status: 'todo' },
      { title: '敲定品牌名并更新站点文案与仓库链接', priority: 'low', difficulty: 'easy', status: 'todo' },
    ],
  },

  {
    id: 'p-luoxinpian',
    name: '裸芯片驱动板',
    tagline: '裸芯片 e-reader 电子纸驱动板 PCB（KiCad 四层板）',
    description:
      'KiCad 硬件项目：设计一块"裸芯片"电子书阅读器（电子纸 EPD）驱动板。板子为四层、0805 封装，主控 QFN-56（U1），含 SD 卡、USB-C（CC1/CC2）、电池/升压供电、I2C、按键、状态 LED 与 RF 天线（L_RF1）。正在把 71 个 easyeda2kicad 封装批量替换为嘉立创（JLCPCB）封装，并反复跑 DRC 收敛违规（从 505 降到 99）。',
    status: 'in-progress',
    phase: 'started',
    progress: 75,
    startDate: '2026-07-17',
    localPath: '/Users/burn/Desktop/裸芯片',
    conditions: [
      '主控 U1（QFN-56）焊盘 57（GND 热焊盘）与 PTH 焊盘存在大量间距违规（实际 0.695 mm）',
      '嘉立创封装板仍有 99–113 处 DRC 违规（clearance / hole_clearance），集中在 U1、USB-C J1、RF 电感 L_RF1',
      '71 个元器件已通过 swap_footprints.py 从 easyeda2kicad 切换到嘉立创封装',
      '原理图 .kicad_sch 最近于 2026-09-01 保存，仍在改动中',
    ],
    bottlenecks: [
      'RF 段 L_RF1 焊盘间距仅 0.1176 mm，需按 RF 要求重排',
      '尚未见 Gerber/BOM 导出与下单记录，离打样还差一步',
      '无 git 远程仓库，版本仅靠 KiCad 本地历史 .history 维护',
      'DRC 违规尚未清零，暂不能交付生产',
    ],
    references: [
      '/Users/burn/Desktop/裸芯片/ereader_bare_v2_副本.kicad_sch',
      '/Users/burn/Desktop/裸芯片/swap_footprints.py',
      '/Users/burn/Desktop/裸芯片/output/最简位号_嘉立创封装_同规则-drc.rpt',
      '/Users/burn/Documents/KiCad/10.0/3rdparty/footprints/com_github_CDFER_JLCPCB-Kicad-Library/JLCPCB.pretty',
    ],
    learning: [
      'KiCad 四层板布局与走线、DRC 收敛',
      'KiCad 封装库迁移（easyeda2kicad → JLCPCB 嘉立创）',
      '电子纸/EPD 驱动板硬件设计（供电、升压、SD、USB-C）',
      '用 Python 解析 KiCad s-expression 文件做批量封装替换',
    ],
    tags: ['KiCad', 'PCB', 'e-paper', '硬件', 'JLCPCB', 'e-reader'],
    accent: 'stone',
    objectives: [
      {
        title: '完成裸芯片 e-reader 驱动板 PCB 布局',
        keyResults: [
          { title: '四层 0805 布局并输出最简位号丝印', progress: 90 },
          { title: '将 DRC 违规从 505 降到 50 以内', progress: 80 },
        ],
      },
      {
        title: '切换为嘉立创封装以支持打样',
        keyResults: [
          { title: '71 个元器件封装替换为嘉立创封装', progress: 100 },
          { title: '通过嘉立创封装规则下的 DRC 检查', progress: 60 },
        ],
      },
      {
        title: '导出 Gerber/BOM 并下单打样',
        keyResults: [
          { title: '生成 Gerber 与 BOM', progress: 20 },
          { title: '在嘉立创完成打样下单', progress: 0 },
        ],
      },
    ],
    todos: [
      { title: '清理 U1（QFN-56）焊盘 57 与 PTH 焊盘的间距违规', priority: 'high', difficulty: 'hard', status: 'todo' },
      { title: '修复 RF 电感 L_RF1 焊盘 0.1176 mm 间距违规', priority: 'high', difficulty: 'hard', status: 'todo' },
      { title: '解决 USB-C J1 的 hole_clearance 违规', priority: 'high', difficulty: 'medium', status: 'todo' },
      { title: '导出 Gerber 与 BOM', priority: 'medium', difficulty: 'medium', status: 'todo' },
      { title: '复核原理图（2026-09-01 最新保存）与 PCB 一致性', priority: 'medium', difficulty: 'medium', status: 'todo' },
      { title: '在嘉立创下单打样', priority: 'medium', difficulty: 'easy', status: 'todo' },
    ],
  },
]

async function main() {
  const ids = PROJECTS.map(p => p.id)
  const slug = (id: string) => id.replace(/^p-/, '')

  // 先清掉这 5 个 id 的旧数据（按 FK 顺序）
  await db.delete(todos).where(inArray(todos.projectId, ids))
  await db.delete(projects).where(inArray(projects.id, ids)) // 级联删 objectives/KRs

  // 写入
  for (const p of PROJECTS) {
    await db.insert(projects).values({
      id: p.id,
      userId: USER_ID,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      status: p.status,
      phase: p.phase,
      progress: p.progress,
      startDate: p.startDate,
      localPath: p.localPath,
      repoUrl: p.repoUrl ?? null,
      liveUrl: p.liveUrl ?? null,
      conditions: p.conditions,
      bottlenecks: p.bottlenecks,
      references: p.references,
      learning: p.learning,
      tags: p.tags,
      accent: p.accent,
    })

    for (let i = 0; i < p.objectives.length; i++) {
      const o = p.objectives[i]
      const oid = `o-${slug(p.id)}-${i + 1}`
      await db.insert(projectObjectives).values({
        id: oid,
        projectId: p.id,
        title: o.title,
        createdAt: p.startDate,
      })
      for (let j = 0; j < o.keyResults.length; j++) {
        await db.insert(projectKeyResults).values({
          id: `kr-${slug(p.id)}-${i + 1}-${j + 1}`,
          objectiveId: oid,
          title: o.keyResults[j].title,
          progress: o.keyResults[j].progress,
          createdAt: p.startDate,
        })
      }
    }

    for (let i = 0; i < p.todos.length; i++) {
      const t = p.todos[i]
      await db.insert(todos).values({
        id: `t-${slug(p.id)}-${i + 1}`,
        userId: USER_ID,
        title: t.title,
        projectId: p.id,
        priority: t.priority,
        difficulty: t.difficulty,
        status: t.status,
        createdAt: TODAY,
      })
    }
  }

  console.log(
    `[import-desktop] 写入完成 — ${PROJECTS.length} 个项目，` +
      PROJECTS.reduce((n, p) => n + p.objectives.length, 0) +
      ' 个目标，`' +
      PROJECTS.reduce((n, p) => n + p.todos.length, 0) +
      '` 个待办，全部归属 demo 用户',
  )
}

main().catch(e => {
  console.error('[import-desktop] 失败', e)
  process.exit(1)
})