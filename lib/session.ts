import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { UserRole } from "./types";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "lite-club-super-secret-key-change-in-production-2024"
);

const SESSION_COOKIE_NAME = "lite_club_session";

export interface SessionPayload {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  role: UserRole;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      studentId: payload.studentId as string,
      name: payload.name as string,
      phone: payload.phone as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
