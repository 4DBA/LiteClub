"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction, quickLoginAction } from "@/server/actions/auth";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ShieldCheck, Wrench, User, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    startTransition(async () => {
      const res = await loginAction({ studentId, password });
      if (res.success) {
        router.refresh();
        router.push("/");
      } else {
        setErrorMsg(res.error || "登录失败");
      }
    });
  };

  const handleQuickLogin = (role: "ADMIN" | "MEMBER" | "USER_1" | "USER_2") => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await quickLoginAction(role);
      if (res.success) {
        router.refresh();
        router.push("/");
      } else {
        setErrorMsg(res.error || "快速登录失败");
      }
    });
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Quick Login Test Panel */}
        <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-semibold text-sm mb-2">
            <Sparkles className="h-4 w-4" />
            <span>开发者/评测人员 1秒快速登录</span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
            点击以下预置账号免输密码直接切换身份体验系统：
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleQuickLogin("ADMIN")}
              className="bg-white justify-start text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:bg-neutral-900"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-red-600" />
              超级管理员
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleQuickLogin("MEMBER")}
              className="bg-white justify-start text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:bg-neutral-900"
            >
              <Wrench className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              技术干部/技师
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleQuickLogin("USER_1")}
              className="bg-white justify-start text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:bg-neutral-900"
            >
              <User className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              学生张三 (已报名)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleQuickLogin("USER_2")}
              className="bg-white justify-start text-xs hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 dark:bg-neutral-900"
            >
              <User className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              学生李四 (在修工单)
            </Button>
          </div>
        </div>

        {/* Standard Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">账号登录</CardTitle>
            <CardDescription>
              登录进入 {siteConfig.shortName}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  学号 / 账号
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="例如: 20240001 或 admin"
                  className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none dark:border-neutral-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  登录密码
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入您的密码"
                  className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none dark:border-neutral-700"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                立即登录
              </Button>
              <div className="text-center text-xs text-neutral-500">
                还没有账号？{" "}
                <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                  快速注册学生账号
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
