export const UserRole = {
  USER: "USER",
  MEMBER: "MEMBER",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const RecruitStatus = {
  PENDING: "PENDING",
  INTERVIEWING: "INTERVIEWING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
} as const;
export type RecruitStatus = (typeof RecruitStatus)[keyof typeof RecruitStatus];

export const TicketStatus = {
  CREATED: "CREATED",
  ACCEPTED: "ACCEPTED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export interface DepartmentItem {
  id: string;
  name: string;
  created_at: Date;
}

export interface RecruitBatchItem {
  id: string;
  name: string;
  is_active: boolean;
  created_at: Date;
}

export interface RecruitApplicationItem {
  id: string;
  batch_id: string;
  user_id: string;
  first_choice_id: string;
  second_choice_id?: string | null;
  status: string;
  intro_text: string;
  resume_url?: string | null;
  admin_notes?: string | null;
  created_at: Date;
  updated_at: Date;
  first_choice?: DepartmentItem | null;
  second_choice?: DepartmentItem | null;
  batch?: RecruitBatchItem | null;
  user?: {
    id: string;
    student_id: string;
    name: string;
    phone: string;
  } | null;
}

export interface ClinicTicketItem {
  id: string;
  requester_id: string;
  technician_id?: string | null;
  device_info: string;
  issue_desc: string;
  status: string;
  repair_notes?: string | null;
  rating?: number | null;
  created_at: Date;
  updated_at: Date;
  requester?: {
    id: string;
    student_id: string;
    name: string;
    phone: string;
  } | null;
  technician?: {
    id: string;
    student_id?: string;
    name: string;
    phone?: string;
  } | null;
}

