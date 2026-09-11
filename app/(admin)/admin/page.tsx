import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getAllApplicationsAction } from "@/server/actions/recruit";
import { getAllTicketsAction } from "@/server/actions/clinic";
import { AdminClientView } from "./admin-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const revalidate = 0;

export default async function AdminPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <CardTitle>管理员控制台权限限制</CardTitle>
            <CardDescription>
              当前页面仅允许系统超级管理员或主席团骨干访问。
            </CardDescription>
          </CardHeader>
          <div className="p-6 pt-0 flex justify-center">
            <Link href="/login">
              <Button>一键切换为超级管理员 (admin)</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const [appsRes, tickets] = await Promise.all([
    getAllApplicationsAction("ALL"),
    getAllTicketsAction(),
  ]);

  const applications = appsRes.success && appsRes.applications ? appsRes.applications : [];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <AdminClientView
        initialApplications={applications}
        initialTickets={tickets}
      />
    </div>
  );
}
