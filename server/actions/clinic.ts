"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { TicketStatus, UserRole } from "@/lib/types";

const CreateTicketSchema = z.object({
  deviceInfo: z.string().min(2, "设备型号不能为空").max(100),
  issueDesc: z.string().min(5, "故障描述不能少于5个字").max(2000),
});

const CompleteTicketSchema = z.object({
  ticketId: z.string().min(1, "工单ID不能为空"),
  repairNotes: z.string().min(3, "维修结论不能少于3个字").max(2000),
});

const RateTicketSchema = z.object({
  ticketId: z.string().min(1, "工单ID不能为空"),
  rating: z.number().int().min(1).max(5),
});

export async function createTicketAction(data: z.infer<typeof CreateTicketSchema>) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "请先登录后再提交义诊工单" };
  }

  const parsed = CreateTicketSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "验证失败" };
  }

  const { deviceInfo, issueDesc } = parsed.data;

  const ticket = await db.clinicTicket.create({
    data: {
      requester_id: session.id,
      device_info: deviceInfo,
      issue_desc: issueDesc,
      status: TicketStatus.CREATED,
    },
  });

  return { success: true, ticket };
}

/**
 * Atomic Ticket Claiming (抢单并发控制 - CAS)
 * UPDATE clinic_ticket SET status='ACCEPTED', technician_id=? WHERE id=? AND status='CREATED'
 */
export async function claimTicketAction(ticketId: string) {
  const session = await getSession();
  if (!session || (session.role !== UserRole.MEMBER && session.role !== UserRole.ADMIN)) {
    return { success: false, error: "仅正式成员或技师有权限抢单" };
  }

  // Execute atomic compare-and-swap update
  const result = await db.clinicTicket.updateMany({
    where: {
      id: ticketId,
      status: TicketStatus.CREATED,
    },
    data: {
      status: TicketStatus.ACCEPTED,
      technician_id: session.id,
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      error: "抢单失败：手慢了！该工单已被其他技师接走或状态已发生变更。",
    };
  }

  const updatedTicket = await db.clinicTicket.findUnique({
    where: { id: ticketId },
    include: { requester: true, technician: true },
  });

  return { success: true, ticket: updatedTicket };
}

export async function completeTicketAction(data: z.infer<typeof CompleteTicketSchema>) {
  const session = await getSession();
  if (!session || (session.role !== UserRole.MEMBER && session.role !== UserRole.ADMIN)) {
    return { success: false, error: "权限不足" };
  }

  const parsed = CompleteTicketSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "验证失败" };
  }

  const { ticketId, repairNotes } = parsed.data;

  const ticket = await db.clinicTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    return { success: false, error: "工单不存在" };
  }

  // Ensure only assigned technician or admin can complete it
  if (ticket.technician_id !== session.id && session.role !== UserRole.ADMIN) {
    return { success: false, error: "您只能办结自己负责的工单" };
  }

  const updated = await db.clinicTicket.update({
    where: { id: ticketId },
    data: {
      status: TicketStatus.COMPLETED,
      repair_notes: repairNotes,
    },
  });

  return { success: true, ticket: updated };
}

export async function rateTicketAction(data: z.infer<typeof RateTicketSchema>) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "请先登录" };
  }

  const parsed = RateTicketSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "验证失败" };
  }

  const { ticketId, rating } = parsed.data;

  const ticket = await db.clinicTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket || ticket.requester_id !== session.id) {
    return { success: false, error: "未找到可评价的工单" };
  }

  if (ticket.status !== TicketStatus.COMPLETED) {
    return { success: false, error: "工单尚未完工，暂无法评分" };
  }

  const updated = await db.clinicTicket.update({
    where: { id: ticketId },
    data: { rating },
  });

  return { success: true, ticket: updated };
}

export async function getOpenTicketsAction() {
  const session = await getSession();
  if (!session || (session.role !== UserRole.MEMBER && session.role !== UserRole.ADMIN)) {
    return [];
  }

  return await db.clinicTicket.findMany({
    where: { status: TicketStatus.CREATED },
    include: {
      requester: {
        select: { id: true, name: true, phone: true, student_id: true },
      },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function getMyStudentTicketsAction() {
  const session = await getSession();
  if (!session) return [];

  return await db.clinicTicket.findMany({
    where: { requester_id: session.id },
    include: {
      technician: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function getMyTechnicianTicketsAction() {
  const session = await getSession();
  if (!session || (session.role !== UserRole.MEMBER && session.role !== UserRole.ADMIN)) {
    return [];
  }

  return await db.clinicTicket.findMany({
    where: {
      technician_id: session.id,
      status: { in: [TicketStatus.ACCEPTED, TicketStatus.COMPLETED] },
    },
    include: {
      requester: {
        select: { id: true, name: true, phone: true, student_id: true },
      },
    },
    orderBy: { updated_at: "desc" },
  });
}

export async function getAllTicketsAction() {
  const session = await getSession();
  if (!session || session.role !== UserRole.ADMIN) {
    return [];
  }

  return await db.clinicTicket.findMany({
    include: {
      requester: {
        select: { id: true, name: true, phone: true, student_id: true },
      },
      technician: {
        select: { id: true, name: true, phone: true, student_id: true },
      },
    },
    orderBy: { created_at: "desc" },
  });
}
