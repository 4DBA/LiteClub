import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getOpenTicketsAction, getMyTechnicianTicketsAction } from "@/server/actions/clinic";
import { WorkbenchClientView } from "./workbench-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const revalidate = 0;

export default async function WorkbenchPage() {
  const session = await getSession();

  if (!session || (session.role !== "MEMBER" && session.role !== "ADMIN")) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <CardTitle>技师抢单工作台权限限制</CardTitle>
            <CardDescription>
              本工作台仅供社团技术部干部与维修技师使用。请使用技师账号登录。
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/login">
              <Button>一键切换为李技师 (tech01)</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const [openTickets, myTickets] = await Promise.all([
    getOpenTicketsAction(),
    getMyTechnicianTicketsAction(),
  ]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <WorkbenchClientView
        role={session.role}
        initialOpenTickets={openTickets}
        initialMyTickets={myTickets}
      />
    </div>
  );
}
