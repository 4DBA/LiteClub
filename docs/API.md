# LiteClub - 接口与业务契约文档 (API & Contract Specifications)

> 本文档规范 LiteClub 系统中的数据模型、核心 Server Actions、REST API 端点以及并发控制实现细节。

---

## 1. 架构总览 (Architecture Overview)

* **通信主导范式**：遵循 Next.js App Router 现代最佳实践，以 **Server Actions** 作为前后端交互的核心载体，实现前后端全链路 TypeScript 类型推导。
* **输入验证标准**：所有 Server Actions 与 API 端点必须使用 **Zod Schema** 进行入参强校验，杜绝非法入参直达数据库。
* **鉴权边界**：权限判定由服务端在 Server Actions / Route Handlers 内部完成，严禁仅依靠前端 UI 组件隐藏进行安全防护。
* **数据格式**：统一响应结构：
  ```typescript
  export type ActionResult<T = unknown> = 
    | { success: true; data: T; message?: string }
    | { success: false; error: string; code?: string };
  ```

---

## 2. 身份鉴权与权限模型 (Auth & Permissions)

### 2.1 角色定义 (`UserRole`)

| 角色代码 | 说明 | 对应权限 |
| --- | --- | --- |
| `USER` | 普通学生 / 报名者 / 求助者 | 志愿报名、查看个人志愿状态、提交电脑维修工单、个人工单评价 |
| `MEMBER` | 正式社团成员 / 技术部维修技师 | 查看公开待修工单池、并发抢单、更新工单排查进度、协助面试打分 |
| `ADMIN` | 组织负责人 / 主席团 / 系统管理员 | 招新批次开关、部门管理、全量工单与报名数据导出、修改成员权限 |

---

## 3. 核心 Server Actions 规范

### 3.1 招新模块 (Recruitment Actions)

#### 1. 提交招新报名 (`submitApplication`)
* **调用者角色**：`USER`
* **约束规则**：每个批次内同一学生仅可提交一次申请（由数据库 `@@unique([batch_id, user_id])` 硬约束）。
* **输入参数 (Zod)**：
  ```typescript
  const SubmitApplicationSchema = z.object({
    batchId: z.string().min(1, "招新批次不能为空"),
    firstChoiceId: z.string().min(1, "第一志愿部门不能为空"),
    secondChoiceId: z.string().optional(),
    introText: z.string().min(20, "自我介绍不得少于20字").max(2000),
    resumeUrl: z.string().url().optional(),
  });
  ```
* **业务逻辑**：
  1. 校验当前用户登录状态；
  2. 校验指定批次 `is_active === true`；
  3. 短事务写入 `recruit_application`，默认状态为 `PENDING`。

#### 2. 招新志愿审核与状态流转 (`reviewApplication`)
* **调用者角色**：`ADMIN` / `MEMBER`
* **输入参数 (Zod)**：
  ```typescript
  const ReviewApplicationSchema = z.object({
    applicationId: z.string(),
    status: z.enum(["PENDING", "INTERVIEWING", "ACCEPTED", "REJECTED"]),
    adminNotes: z.string().max(1000).optional(),
  });
  ```

---

### 3.2 义诊工单模块 (Clinic Ticket Actions)

#### 1. 创建义诊工单 (`createClinicTicket`)
* **调用者角色**：`USER`
* **输入参数 (Zod)**：
  ```typescript
  const CreateTicketSchema = z.object({
    deviceInfo: z.string().min(2, "请输入设备型号").max(100),
    issueDesc: z.string().min(10, "请详细描述故障现象").max(2000),
  });
  ```
* **状态初始值**：`status: "CREATED"`

---

#### 2. 技师并发安全抢单 (`claimClinicTicket`) ★ Critical

用于技术部技师认领待维修工单。必须在高并发场景下严格防止多个技师同时抢到同一工单。

* **调用者角色**：`MEMBER` / `ADMIN`
* **输入参数 (Zod)**：
  ```typescript
  const ClaimTicketSchema = z.object({
    ticketId: z.string(),
  });
  ```
* **原子更新实现机制**：
  ```typescript
  // 采用带状态条件的原子更新 (CAS - Compare And Swap)
  const result = await db.clinicTicket.updateMany({
    where: {
      id: ticketId,
      status: "CREATED", // 仅在当前状态确为待接单时才允许更新
    },
    data: {
      status: "ACCEPTED",
      technician_id: sessionUser.id,
    },
  });

  if (result.count === 0) {
    throw new Error("该工单已被其他技师接单或状态已变更！");
  }
  ```
* **底层原生 SQL 对齐**：
  ```sql
  UPDATE clinic_ticket 
  SET status='ACCEPTED', technician_id=? 
  WHERE id=? AND status='CREATED';
  ```

---

#### 3. 办结工单与填写维修报告 (`completeClinicTicket`)
* **调用者角色**：接单技师本人或 `ADMIN`
* **输入参数 (Zod)**：
  ```typescript
  const CompleteTicketSchema = z.object({
    ticketId: z.string(),
    repairNotes: z.string().min(5, "请填写维修处理方案及结果"),
  });
  ```
* **状态流转**：`ACCEPTED` -> `COMPLETED`

---

#### 4. 评价工单 (`rateClinicTicket`)
* **调用者角色**：工单求助学生本人
* **输入参数 (Zod)**：
  ```typescript
  const RateTicketSchema = z.object({
    ticketId: z.string(),
    rating: z.number().int().min(1).max(5),
  });
  ```

---

## 4. 列表查询与分页契约 (Pagination Contract)

PRD 规定所有列表必须分页，禁止全表扫描，P95 < 500ms：

```typescript
export interface PaginationParams {
  page?: number;     // 默认 1
  pageSize?: number; // 默认 10，最大 50
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## 5. REST API 端点 (Route Handlers)

### 5.1 本地简历文件上传 (`POST /api/upload`)
* **功能**：接收学生上传的 PDF/DOCX 简历文件，安全保存至本地 `uploads/` 目录。
* **文件约束**：
  * 最大文件大小：`5MB`
  * 允许 MIME 类型：`application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  * 文件名安全策略：重命名为 `<uuid>-<safe-name>.<ext>`，杜绝目录穿越攻击。
* **响应格式**：
  ```json
  {
    "success": true,
    "fileUrl": "/uploads/cmtv5_resume.pdf"
  }
  ```

---

## 6. 错误码规范 (Error Handling)

| 错误代码 | 说明 | 对应 HTTP 状态码 |
| --- | --- | --- |
| `UNAUTHORIZED` | 未登录或登录已过期 | 401 |
| `FORBIDDEN` | 角色权限不足（如普通学生尝试接单） | 403 |
| `CONFLICT_ALREADY_CLAIMED` | 工单已被抢走（抢单失败） | 409 |
| `BATCH_CLOSED` | 当前招新批次已截止或未开放 | 400 |
| `VALIDATION_ERROR` | 入参格式错误，未通过 Zod 校验 | 400 |
| `NOT_FOUND` | 目标数据记录不存在 | 404 |
