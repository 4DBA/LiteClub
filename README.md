# LiteClub - 学生组织管理系统 (Student Organization Management System)

> 基于 **Next.js (App Router) + TypeScript + SQLite (Prisma) + Tailwind CSS + shadcn/ui** 的一站式学生组织/社团综合管理系统。

---

## 📖 项目简介 (Overview)

**LiteClub** 专为高校社团、学生科技协会等学生组织设计，提供招新管理、部门志愿填报、面试进度追踪、电脑义诊求助以及技术人员并发抢单维修等核心功能。

系统遵循**实用、高内聚、轻量级**的单体架构设计，严禁过度工程化与冗余中间件（无 Redis、无消息队列、无微服务）。在保证高可用、低成本（1核2G云服务器即可稳定运行）的同时，严格规范 SQLite WAL 并发事务处理，彻底杜绝数据脏写与超卖问题。

> 💡 **动态品牌配置**：系统名称、简称、版权等信息杜绝硬编码，全部通过 `lib/site-config.ts` 及环境变量注入，方便不同组织一键换皮部署。

---

## 🛠️ 技术栈选型 (Tech Stack)

| 层级 | 选型 | 说明 |
| --- | --- | --- |
| **应用框架** | Next.js 16 (App Router) + TypeScript | 页面与 Server Actions 一体化，业务参数使用 Zod 校验 |
| **运行时** | Node.js 20+ | 单进程 / 单机轻量部署 |
| **数据库** | SQLite | 嵌入式单文件数据库 (`data/app.db`)，集成 Prisma ORM 进行版本迁移与强类型操作 |
| **UI 样式** | Tailwind CSS + shadcn/ui | 移动优先响应式设计，完美适配手机端报名与抢单 |
| **身份鉴权** | 自建账号体系 + Password Hash (bcrypt) | 预留统一身份认证 (SSO) 扩展接口 |
| **文件存储** | 本地 `uploads/` 目录 | 一期不上对象存储，极简维护 |
| **架构红线** | 严禁引入外部缓存/队列 | 杜绝 Redis、MQ、微服务、多容器直连同个 SQLite |

---

## ⚡ 容量假设与性能基线 (Capacity & Baseline)

* **并发容量**：日常 DAU < 100；同时在线通常 < 30。纳新短时峰值并发提交数十人。数据量 3 年内为万级行（SQLite 性能完全冗余）。
* **响应时延目标**：
  * 普通列表查询：**P95 < 500ms** (全部分页，杜绝全表扫描)
  * 报名提交 / 抢单 / 状态流转等写操作：**P95 < 300ms**

---

## 🔒 SQLite 并发约束规范 (Strict SQLite Rules)

为确保 SQLite 数据库长期稳定运行，系统强制执行以下准则：

1. **强制 WAL (Write-Ahead Logging) 模式**：
   ```sql
   PRAGMA journal_mode=WAL;
   PRAGMA busy_timeout=5000;
   PRAGMA synchronous=NORMAL;
   PRAGMA foreign_keys=ON;
   ```
2. **单写者与短事务**：同一时刻仅允许一个写事务，所有报名、抢单操作在毫秒级短事务内完成。
3. **安全并发抢单机制**：技师接单必须采用带状态条件的前置原子更新：
   ```sql
   UPDATE clinic_ticket SET status='ACCEPTED', technician_id=? WHERE id=? AND status='CREATED'
   ```
   若影响行数为 0，则立即抛出“工单已被抢走”异常，杜绝高并发重复接单。
4. **单机持久化存储**：数据库必须放置于本地磁盘，严禁挂载在网络文件系统 (NFS) 或只读 Serverless 实例上。

---

## 📂 目录结构 (Directory Structure)

```text
LiteClub/
├── app/
│   ├── (public)/          # 公开页面（登录、注册、招新门户、义诊申请）
│   ├── (member)/          # 成员/技师页面（工作台、抢单中心、志愿审批）
│   ├── (admin)/           # 管理员/主席团控制台（招新批次管理、部门配置、数据导出）
│   ├── api/               # API 路由（文件上传、报表导出等必要端点）
│   ├── layout.tsx         # 全局根布局
│   └── page.tsx           # 门户入口页
├── components/            # 可复用 UI 组件 (shadcn/ui)
├── data/                  # SQLite 数据库文件存放处 (app.db, gitignored)
├── docs/                  # 需求说明与 API 文档
│   ├── PRD_AGENT_PROMPT.md# 完整原始 PRD 规范
│   └── API.md             # 接口契约与数据交互文档
├── lib/
│   ├── auth.ts            # 鉴权逻辑与密码哈希
│   ├── db.ts              # PrismaClient 单例连接与 WAL PRAGMA 初始化
│   ├── site-config.ts     # 全局品牌配置（读取环境变量，无硬编码）
│   ├── types.ts           # 核心领域模型与枚举类型
│   └── utils.ts           # 类名合并辅助方法 (cn)
├── prisma/
│   ├── schema.prisma      # 数据库 Schema 定义
│   └── seed.ts            # 一键数据填充脚本
├── server/
│   └── actions/           # 核心业务 Server Actions (Zod 强校验)
├── uploads/               # 用户上传文件存储目录 (gitignored)
├── .env.example           # 环境变量模板
└── package.json           # 项目依赖与脚本配置
```

---

## 🚀 快速开始 (Quick Start)

### 1. 环境准备
* Node.js 20+
* npm 10+ / pnpm

### 2. 克隆与安装依赖
```bash
git clone https://github.com/4DBA/LiteClub.git
cd LiteClub
npm install
```

### 3. 配置环境变量
复制环境变量配置文件：
```bash
cp .env.example .env
```
根据需求修改 `.env` 中的参数：
```env
DATABASE_URL="file:../data/app.db"
UPLOAD_DIR="./uploads"
APP_URL="http://localhost:3000"
JWT_SECRET="your_custom_secret_key"

# 自定义组织名称（全站动态生效）
NEXT_PUBLIC_SITE_NAME="XX大学计算机协会管理系统"
NEXT_PUBLIC_SITE_SHORT_NAME="计协后台"
```

### 4. 初始化数据库与执行种子数据
```bash
# 生成 SQLite 库并同步表结构
npm run db:push

# 注入初始测试数据（包含各类角色用户、部门、招新批次及测试工单）
npm run db:seed
```

### 5. 启动本地开发服务
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

---

## 👥 默认测试账号 (Default Test Accounts)

| 身份 / 角色 | 学号/账号 | 默认密码 | 说明 |
| --- | --- | --- | --- |
| **超级管理员 (ADMIN)** | `admin` | `Admin123!` | 拥有全站所有管理权限 |
| **维修技师/干部 (MEMBER)** | `tech01` | `Tech123!` | 技术部维修技师，可抢单、处理工单 |
| **普通学生 A (USER)** | `20240001` | `Student123!` | 已提交报名技术部、提交了义诊工单 |
| **普通学生 B (USER)** | `20240002` | `Student123!` | 已提交重装系统工单 |

---

## 📋 常用开发脚本 (Available Scripts)

* `npm run dev`：启动 Next.js 本地开发热重载服务。
* `npm run build`：生产构建并进行静态检查与类型验证。
* `npm run start`：启动生产环境服务。
* `npm run lint`：运行 ESLint 代码规范扫描。
* `npm run db:push`：将 Prisma Schema 变更同步至 SQLite。
* `npm run db:seed`：执行数据填充脚本。
* `npm run db:studio`：启动 Prisma 网页可视化数据库管理后台。

---

## 📄 许可协议 (License)

本项目采用 MIT 开源许可协议。
