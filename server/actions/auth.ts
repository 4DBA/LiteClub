"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { comparePassword, hashPassword } from "@/lib/auth";
import { createSession, destroySession, getSession, SessionPayload } from "@/lib/session";
import { UserRole } from "@/lib/types";

const LoginSchema = z.object({
  studentId: z.string().min(1, "请输入学号/账号"),
  password: z.string().min(1, "请输入密码"),
});

const RegisterSchema = z.object({
  studentId: z.string().min(3, "学号长度至少为3位").max(20, "学号长度不能超过20位"),
  name: z.string().min(2, "姓名至少2个字符").max(20, "姓名不能超过20位"),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入正确的11位手机号码"),
  password: z.string().min(6, "密码长度至少6位"),
});

export async function loginAction(data: z.infer<typeof LoginSchema>) {
  const parsed = LoginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "验证失败" };
  }

  const { studentId, password } = parsed.data;

  const user = await db.user.findUnique({
    where: { student_id: studentId },
  });

  if (!user) {
    return { success: false, error: "账号或密码错误" };
  }

  const isMatch = await comparePassword(password, user.hashed_password);
  if (!isMatch) {
    return { success: false, error: "账号或密码错误" };
  }

  const sessionPayload: SessionPayload = {
    id: user.id,
    studentId: user.student_id,
    name: user.name,
    phone: user.phone,
    role: user.role as UserRole,
  };

  await createSession(sessionPayload);
  return { success: true, user: sessionPayload };
}

export async function quickLoginAction(targetRole: "ADMIN" | "MEMBER" | "USER_1" | "USER_2") {
  const targetMap = {
    ADMIN: "admin",
    MEMBER: "tech01",
    USER_1: "20240001",
    USER_2: "20240002",
  };

  const studentId = targetMap[targetRole];
  const user = await db.user.findUnique({
    where: { student_id: studentId },
  });

  if (!user) {
    return { success: false, error: `预设账号 ${studentId} 不存在，请先执行 npm run db:seed` };
  }

  const sessionPayload: SessionPayload = {
    id: user.id,
    studentId: user.student_id,
    name: user.name,
    phone: user.phone,
    role: user.role as UserRole,
  };

  await createSession(sessionPayload);
  return { success: true, user: sessionPayload };
}

export async function registerAction(data: z.infer<typeof RegisterSchema>) {
  const parsed = RegisterSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "验证失败" };
  }

  const { studentId, name, phone, password } = parsed.data;

  const existingUser = await db.user.findUnique({
    where: { student_id: studentId },
  });

  if (existingUser) {
    return { success: false, error: "该学号已被注册" };
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await db.user.create({
    data: {
      student_id: studentId,
      name,
      phone,
      role: UserRole.USER,
      hashed_password: hashedPassword,
    },
  });

  const sessionPayload: SessionPayload = {
    id: newUser.id,
    studentId: newUser.student_id,
    name: newUser.name,
    phone: newUser.phone,
    role: newUser.role as UserRole,
  };

  await createSession(sessionPayload);
  return { success: true, user: sessionPayload };
}

export async function logoutAction() {
  await destroySession();
  return { success: true };
}

export async function getCurrentUserAction() {
  return await getSession();
}
