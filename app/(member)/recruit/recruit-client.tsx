"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitApplicationAction } from "@/server/actions/recruit";
import { DepartmentItem, RecruitBatchItem, RecruitApplicationItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, HelpCircle, XCircle, Loader2, Sparkles } from "lucide-react";

interface RecruitClientViewProps {
  initialMeta: {
    activeBatch: RecruitBatchItem | null;
    departments: DepartmentItem[];
  };
  initialApplication: RecruitApplicationItem | null;
}

export function RecruitClientView({ initialMeta, initialApplication }: RecruitClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [firstChoiceId, setFirstChoiceId] = useState(
    initialMeta.departments.length > 0 ? initialMeta.departments[0].id : ""
  );
  const [secondChoiceId, setSecondChoiceId] = useState("");
  const [introText, setIntroText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialMeta.activeBatch) return;

    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await submitApplicationAction({
        batchId: initialMeta.activeBatch!.id,
        firstChoiceId,
        secondChoiceId: secondChoiceId || undefined,
        introText,
      });

      if (res.success) {
        setSuccessMsg("报名成功！面试安排将通过本系统更新，请留意状态通知。");
        router.refresh();
      } else {
        setErrorMsg(res.error || "报名提交失败");
      }
    });
  };

  // If already applied
  if (initialApplication) {
    const getStatusBadge = (status: string) => {
      switch (status) {
        case "ACCEPTED":
          return (
            <Badge variant="success" className="text-sm px-3 py-1">
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              已正式录取
            </Badge>
          );
        case "INTERVIEWING":
          return (
            <Badge variant="info" className="text-sm px-3 py-1">
              <Clock className="mr-1.5 h-4 w-4" />
              面试中
            </Badge>
          );
        case "REJECTED":
          return (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              <XCircle className="mr-1.5 h-4 w-4" />
              婉拒
            </Badge>
          );
        default:
          return (
            <Badge variant="warning" className="text-sm px-3 py-1">
              <HelpCircle className="mr-1.5 h-4 w-4" />
              待筛选 / 处理中
            </Badge>
          );
      }
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">我的招新报名</h1>
          <p className="text-sm text-neutral-500 mt-1">您已成功提交本轮招新申请，可在本页实时查看进展</p>
        </div>

        <Card className="border-blue-200 shadow-md">
          <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg">{initialApplication.batch?.name || "招新报名"}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  提交时间：{new Date(initialApplication.created_at).toLocaleString("zh-CN")}
                </CardDescription>
              </div>
              <div>{getStatusBadge(initialApplication.status)}</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div>
                <span className="text-xs text-neutral-500">第一志愿</span>
                <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {initialApplication.first_choice?.name}
                </p>
              </div>
              <div>
                <span className="text-xs text-neutral-500">第二志愿</span>
                <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {initialApplication.second_choice?.name || "无"}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">个人简介与理由</span>
              <div className="mt-1 rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 whitespace-pre-wrap">
                {initialApplication.intro_text}
              </div>
            </div>

            {initialApplication.admin_notes && (
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900">
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">面试通知与备注：</div>
                <div>{initialApplication.admin_notes}</div>
              </div>
            )}

            {initialApplication.status === "ACCEPTED" && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Sparkles className="h-4 w-4" />
                  恭喜加入我们！
                </div>
                <p className="text-xs mt-1">
                  您已顺利通过所有考核环节，请保持手机畅通，干部将尽快与您联系入群事宜。
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form to apply
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">招新报名填报</h1>
        <p className="text-sm text-neutral-500 mt-1">
          当前招新季：<span className="font-semibold text-blue-600">{initialMeta.activeBatch?.name || "开放招新"}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">报名信息登记</CardTitle>
          <CardDescription>
            请如实填写您的志愿部门与个人陈述，每个批次仅可提交一次。
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="rounded-md bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  第一志愿部门 <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={firstChoiceId}
                  onChange={(e) => setFirstChoiceId(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                >
                  {initialMeta.departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  第二志愿部门 (可选)
                </label>
                <select
                  value={secondChoiceId}
                  onChange={(e) => setSecondChoiceId(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                >
                  <option value="">-- 不选第二志愿 --</option>
                  {initialMeta.departments
                    .filter((d) => d.id !== firstChoiceId)
                    .map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  自我介绍 / 申请理由 <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-neutral-400">已输入 {introText.length} 字</span>
              </div>
              <textarea
                required
                rows={5}
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                placeholder="介绍您的个人特长、过往经历以及希望加入对应部门的原因..."
                className="w-full rounded-md border border-neutral-300 bg-white p-3 text-sm placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button type="submit" disabled={isPending || introText.length < 10}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认提交报名
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
