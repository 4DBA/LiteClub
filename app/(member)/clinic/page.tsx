import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getMyStudentTicketsAction } from "@/server/actions/clinic";
import { ClinicClientView } from "./clinic-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Laptop, LogIn } from "lucide-react";

export const revalidate = 0;

export default async function ClinicPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-2">
              <Laptop className="h-6 w-6" />
            </div>
            <CardTitle>请先登录后再提交义诊工单</CardTitle>
            <CardDescription>
              登录后即可登记设备故障，追踪维修进度并对技师服务进行评价
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center gap-3">
            <Link href="/login">
              <Button>
                <LogIn className="mr-2 h-4 w-4" />
                前往登录 / 体验
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">注册新账号</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const tickets = await getMyStudentTicketsAction();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <ClinicClientView initialTickets={tickets} />
    </div>
  );
}
