import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getSession } from "@/lib/session";
import { Navbar } from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50 font-sans">
        <Navbar initialUser={session} />
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="border-t border-neutral-200 bg-white py-6 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="container mx-auto px-4">
            <p>{siteConfig.copyright}</p>
            <p className="mt-1 text-neutral-400">基于 Next.js + SQLite WAL 构建的高可用学生组织系统</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
