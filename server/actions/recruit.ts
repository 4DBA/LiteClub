"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { RecruitStatus, UserRole } from "@/lib/types";

const SubmitApplicationSchema = z.object({
  batchId: z.string().min(1, "招新批次不能为空"),
  firstChoiceId: z.string().min(1, "请选择第一志愿部门"),
  secondChoiceId: z.string().optional(),
  introText: z.string().min(10, "个人介绍/申请理由不能少于10字").max(2000, "不能超过2000字"),
  resumeUrl: z.string().optional(),
});

const UpdateStatusSchema = z.object({
  applicationId: z.string().min(1, "申请ID不能为空"),
  status: z.enum([
    RecruitStatus.PENDING,
    RecruitStatus.INTERVIEWING,
    RecruitStatus.ACCEPTED,
    RecruitStatus.REJECTED,
  ]),
  adminNotes: z.string().optional(),
});

export async function getRecruitMetaAction() {
  const [activeBatch, departments] = await Promise.all([
    db.recruitBatch.findFirst({
      where: { is_active: true },
      orderBy: { created_at: "desc" },
    }),
    db.department.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return { activeBatch, departments };
}

export async function getMyApplicationAction() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const activeBatch = await db.recruitBatch.findFirst({
    where: { is_active: true },
  });

  if (!activeBatch) {
    return null;
  }

  const application = await db.recruitApplication.findUnique({
    where: {
      batch_id_user_id: {
        batch_id: activeBatch.id,
        user_id: session.id,
      },
    },
    include: {
      first_choice: true,
      second_choice: true,
      batch: true,
    },
  });

  return application;
}

export async function submitApplicationAction(data: z.infer<typeof SubmitApplicationSchema>) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "请先登录后再提交报名" };
  }

  const parsed = SubmitApplicationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "验证失败" };
  }

  const { batchId, firstChoiceId, secondChoiceId, introText, resumeUrl } = parsed.data;

  // Verify batch is active
  const batch = await db.recruitBatch.findUnique({
    where: { id: batchId },
  });

  if (!batch || !batch.is_active) {
    return { success: false, error: "当前招新批次已关闭或不存在" };
  }

  // Check if first and second choices are the same
  if (secondChoiceId && secondChoiceId === firstChoiceId) {
    return { success: false, error: "第一志愿与第二志愿不能相同" };
  }

  // Check for duplicate application
  const existing = await db.recruitApplication.findUnique({
    where: {
      batch_id_user_id: {
        batch_id: batchId,
        user_id: session.id,
      },
    },
  });

  if (existing) {
    return { success: false, error: "您已在当前批次提交过报名，无法重复提交" };
  }

  const application = await db.recruitApplication.create({
    data: {
      batch_id: batchId,
      user_id: session.id,
      first_choice_id: firstChoiceId,
      second_choice_id: secondChoiceId || null,
      intro_text: introText,
      resume_url: resumeUrl || null,
      status: RecruitStatus.PENDING,
    },
  });

  return { success: true, application };
}

export async function getAllApplicationsAction(filterStatus?: string) {
  const session = await getSession();
  if (!session || (session.role !== UserRole.ADMIN && session.role !== UserRole.MEMBER)) {
    return { success: false, error: "权限不足" };
  }

  const whereClause: { status?: string } = {};
  if (filterStatus && filterStatus !== "ALL") {
    whereClause.status = filterStatus;
  }

  const applications = await db.recruitApplication.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          student_id: true,
          name: true,
          phone: true,
        },
      },
      first_choice: true,
      second_choice: true,
      batch: true,
    },
    orderBy: { created_at: "desc" },
  });

  return { success: true, applications };
}

export async function updateApplicationStatusAction(data: z.infer<typeof UpdateStatusSchema>) {
  const session = await getSession();
  if (!session || session.role !== UserRole.ADMIN) {
    return { success: false, error: "仅管理员可审批招新申请" };
  }

  const parsed = UpdateStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "验证失败" };
  }

  const { applicationId, status, adminNotes } = parsed.data;

  const updated = await db.recruitApplication.update({
    where: { id: applicationId },
    data: {
      status,
      admin_notes: adminNotes !== undefined ? adminNotes : undefined,
    },
  });

  return { success: true, application: updated };
}
