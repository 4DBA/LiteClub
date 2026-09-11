export interface SiteConfig {
  name: string;
  shortName: string;
  description: string;
  url: string;
  copyright: string;
}

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "学生组织管理系统",
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME || "组织后台",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "一站式学生组织招新管理与义诊求助系统",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  copyright:
    process.env.NEXT_PUBLIC_COPYRIGHT ||
    `© ${new Date().getFullYear()} ${process.env.NEXT_PUBLIC_SITE_NAME || "学生组织管理系统"}. All rights reserved.`,
} as const;

export type SiteConfigType = typeof siteConfig;
