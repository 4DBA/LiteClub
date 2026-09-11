import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getRecruitMetaAction, getMyApplicationAction } from "@/server/actions/recruit";
import { RecruitClientView } from "./recruit-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Users, LogIn } from "lucide-react";

export const revalidate = 0;

export default async function RecruitPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-2">
              <Users className="h-6 w-6" />
            </div>
            <CardTitle>请先登录后再进行招新报名</CardTitle>
            <CardDescription>
              登录学生账号后，即可填写部门志愿与个人简介，并实时追踪录取状态
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

  const [meta, myApplication] = await Promise.all([
    getRecruitMetaAction(),
    getMyApplicationAction(),
  ]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <RecruitClientView
        initialMeta={meta}
        initialApplication={myApplication}
      />
    </div>
  );
}
