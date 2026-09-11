"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    phone: "",
    password: "",
  });
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    startTransition(async () => {
      const res = await registerAction(formData);
      if (res.success) {
        router.refresh();
        router.push("/");
      } else {
        setErrorMsg(res.error || "注册失败");
      }
    });
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">新学生账号注册</CardTitle>
            <CardDescription>
              注册后即可参与招新报名、电脑义诊预约与咨询
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  {errorMsg}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  真实学号
                </label>
                <input
                  type="text"
                  name="studentId"
                  required
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="例如: 20240003"
                  className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none dark:border-neutral-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  姓名
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="例如: 王五"
                  className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none dark:border-neutral-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  手机号码 (用于接收面试与工单维修通知)
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="11位手机号码"
                  className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none dark:border-neutral-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  设置密码 (至少6位)
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="请输入6位以上密码"
                  className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none dark:border-neutral-700"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                提交注册并登录
              </Button>
              <div className="text-center text-xs text-neutral-500">
                已有账号？{" "}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                  返回登录
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
