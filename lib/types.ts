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
