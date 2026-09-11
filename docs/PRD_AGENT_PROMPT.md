# AI Execution Directives & System PRD

> **To the AI Agent:** You are acting as an expert Full-Stack Developer. This document defines Phase 1 of a student organization management system. Prioritize straightforward, robust implementations over enterprise-scale abstractions. Strictly adhere to the technology stack and constraints defined below.

## 1. 技术栈选型 (Tech Stack - Phase 1)

| 层级 | 选型 | 说明 |
| --- | --- | --- |
| **框架** | Next.js (App Router) + TypeScript | 页面与 Server Actions 一体化，业务逻辑使用 Zod 校验。 |
| **运行环境** | Node.js 20+ | 单进程或单机部署。 |
| **数据库** | SQLite | 文件库，使用 Prisma 或 Drizzle（二选一，需有 migration）。 |
| **鉴权** | 自建账号 + JWT / 或 NextAuth | 预留 SSO 字段。 |
| **文件存储** | 本地 `uploads/` 目录 | 一期不上云端对象存储（OSS/S3）。 |
| **UI/样式** | shadcn/ui + Tailwind CSS | 必须响应式，确保手机端能流畅完成报名、签到、抢单。 |
| **架构红线** | **严禁引入** | 明确不做：Redis、消息队列、微服务、独立后端、Serverless 多实例直连同个 SQLite。 |

## 2. 规模假设与容量指标 (Capacity & Performance Baseline)

* **并发与容量**：日常 DAU < 100；同时在线通常 < 30。纳新短时峰值并发提交数十人。数据量 3 年内为万级行（SQLite 性能完全冗余）。
* **性能基线**：
* 普通列表 P95 < 500ms
* 报名提交 / 抢单 / 签到等写入操作 P95 < 300ms
* 无需引入缓存层，若无法达标，优先排查是否漏建索引或存在全表扫描。



## 3. SQLite 强制约束 (Strict SQLite Rules)

为了让 SQLite 在本系统中稳定运行，**必须**遵守以下代码和部署约束：

1. **单写者与并发控制**：SQLite 同时只能有一个写事务。必须避免 N+1 写入。
2. **强制开启 WAL 模式**：
```sql
PRAGMA journal_mode=WAL;
PRAGMA busy_timeout=5000;
PRAGMA synchronous=NORMAL;
PRAGMA foreign_keys=ON;

```


3. **部署限制**：只能有一个 Node 进程写库。不要放在 NFS 或只读的 Serverless (如默认的 Vercel) 文件系统上。数据库必须在本地持久化磁盘。
4. **短事务原则**：写操作（报名、抢单、签到）必须用一次短事务完成校验和写入。
5. **查询原则**：列表全部分页，禁止一次拉取全表。

## 4. 核心数据模型 (Database Schema Specifications)

请根据以下说明生成完整的 Prisma/Drizzle Schema。必须注意外键、枚举状态和并发控制字段。

### 4.1. 招新报名表 (`RecruitApplication`)

用于管理招新季报名，支持多部门志愿和面试状态追踪。

| 字段 | 类型 | 属性 | 说明 |
| --- | --- | --- | --- |
| `id` | String/UUID | Primary Key |  |
| `batch_id` | String | Foreign Key | 关联 `RecruitBatch`（如 2024秋季招新）。 |
| `user_id` | String | Foreign Key | 关联 `User`（报名者）。 |
| `first_choice_id` | String | Foreign Key | 第一志愿，关联 `Department`。 |
| `second_choice_id` | String | FK / Nullable | 第二志愿（可选）。 |
| `status` | Enum | Default: `PENDING` | `PENDING`(待处理), `INTERVIEWING`(面试中), `ACCEPTED`(已录取), `REJECTED`(婉拒)。 |
| `intro_text` | Text |  | 自我介绍或报名理由。 |
| `resume_url` | String | Nullable | 本地简历文件路径 (指向 `uploads/`)。 |
| `admin_notes` | Text | Nullable | 面试官内部备注（对报名者不可见）。 |

* **约束 & 索引**：设置 `@@unique([batch_id, user_id])` 防止同一批次重复报名。为 `batch_id` 和 `status` 建立索引。

### 4.2. 义诊工单表 (`ClinicTicket`)

用于电脑维修求助。**必须支持技师安全地并发抢单。**

| 字段 | 类型 | 属性 | 说明 |
| --- | --- | --- | --- |
| `id` | String/UUID | Primary Key |  |
| `requester_id` | String | Foreign Key | 关联 `User`（求助学生）。 |
| `technician_id` | String | FK / Nullable | 关联 `User`（维修技师），创建时为空。 |
| `device_info` | String |  | 设备型号（如 MacBook Air M1）。 |
| `issue_desc` | Text |  | 故障详细描述。 |
| `status` | Enum | Default:`CREATED` | `CREATED`(待接单), `ACCEPTED`(已接单), `COMPLETED`(已解决), `CANCELLED`(已取消)。 |
| `repair_notes` | Text | Nullable | 维修完成后的技师备注。 |
| `rating` | Int | Nullable | 1-5星，完成后由求助者填写。 |

* **抢单并发规则 (Critical)**：技师接单的 Server Action **必须**使用带状态条件的原子更新防超卖：
`UPDATE clinic_ticket SET status='ACCEPTED', technician_id=? WHERE id=? AND status='CREATED'`
如果影响行数为 0，则抛出“工单已被抢走”的错误。
* **索引**：为 `status`、`technician_id` 和 `requester_id` 建立索引。

### 4.3. 基础支撑实体 (Supporting Entities)

* **`User`**: `id`, `student_id` (Unique), `name`, `phone`, `role` (Enum: USER, MEMBER, ADMIN), `hashed_password`.
* **`Department`**: `id`, `name` (如 "技术部", "宣传部").
* **`RecruitBatch`**: `id`, `name`, `is_active` (Boolean).

## 5. Next.js 架构与目录约定 (Architecture Conventions)

推荐并强制使用以下项目结构：

```text
app/
  (public)/          # 登录注册、活动公开列表、主页
  (member)/          # 需登录的普通成员/报名者页面
  (admin)/           # 干部/主席团/管理员后台
  api/               # 仅必要时使用（上传、文件导出、定时回调）
lib/
  db.ts              # 数据库单例连接
  auth.ts            # 鉴权逻辑
  site-config.ts     # 全局系统配置（避免硬编码）
server/
  actions/           # 核心业务 Server Actions (必须用 Zod 校验入参)
prisma/ 或 drizzle/
uploads/             # 本地上传文件存放地（需通过 gitignore 忽略）
data/app.db          # SQLite 数据库文件

```

**系统约定**：

* **系统名称禁止硬编码**：系统名称、Logo、版权信息等严禁直接写死在页面组件或 Layout 中。必须在 `lib/site-config.ts` 中通过环境变量注入供全局引用，以便后续复用换皮：
```typescript
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "学生组织管理系统",
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME || "组织后台",
}

```


* **服务端鉴权**：权限判定必须在 Server Actions 内部进行（`server/actions/`），不能仅仅依靠前端隐藏按钮。
* **Seed 脚本**：必须提供 `npm run db:seed` 脚本，用于一键生成测试数据（管理员、不同角色的用户、当前招新批次、示例部门、测试工单）。

## 6. 部署与后续演进策略

* **初期部署推荐**：1 核 2G Linux VPS + Docker Compose（`web` 单容器应用，挂载 `./data` 和 `./uploads` 卷）。不要部署到 Vercel/Netlify 等无状态平台上当作主站。
* **备份策略**：每天拷贝 `app.db` 和 `app.db-wal` 备份（拷贝，而不是将运行库直接挂载在网盘）。
* **环境变量配置示例**：
```text
# 数据库与本地存储配置
DATABASE_URL=file:./data/app.db
UPLOAD_DIR=./uploads
APP_URL=https://club.example.edu
JWT_SECRET=your_super_secret_key_here

# 系统基础配置（避免硬编码）
NEXT_PUBLIC_SITE_NAME="XX大学计算机协会管理系统"
NEXT_PUBLIC_SITE_SHORT_NAME="计协后台"

```


* **何时抛弃 SQLite（一期暂不考虑）**：
* 当需要多台服务器负载均衡或 Kubernetes 多副本部署时。
* 纳新峰值出现频繁的写锁等待（Write Lock Timeout）或严重阻塞时。
* *Agent 注意：在编写代码时，日期函数、字符串拼接请尽量使用 ORM 自带的方法，减少原生 SQLite 特有函数（如 `datetime('now')`）的硬编码，为将来无缝迁移 PostgreSQL 留出余地。*

