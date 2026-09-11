import bcrypt from "bcryptjs";
import { UserRole } from "./types";

export interface SessionUser {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
