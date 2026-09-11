"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimTicketAction, completeTicketAction } from "@/server/actions/clinic";
import { ClinicTicketItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Zap,
  CheckCircle2,
  Phone,
  User,
  Clock,
  Loader2,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";

interface WorkbenchClientViewProps {
  role: string;
  initialOpenTickets: ClinicTicketItem[];
  initialMyTickets: ClinicTicketItem[];
}

export function WorkbenchClientView({
  role,
  initialOpenTickets,
  initialMyTickets,
}: WorkbenchClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Claim error & success states
  const [claimFeedback, setClaimFeedback] = useState<{
    ticketId?: string;
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Complete ticket modal state
  const [completingTicketId, setCompletingTicketId] = useState<string | null>(null);
  const [repairNotes, setRepairNotes] = useState("");

  const handleClaim = (ticketId: string) => {
    setClaimFeedback(null);
    startTransition(async () => {
      const res = await claimTicketAction(ticketId);
      if (res.success) {
        setClaimFeedback({
          ticketId,
          type: "success",
          message: "🎉 抢单成功！工单已归入您的在办列表。",
        });
        router.refresh();
      } else {
        setClaimFeedback({
          ticketId,
          type: "error",
          message: res.error || "抢单失败",
        });
        router.refresh();
      }
    });
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTicketId) return;

    startTransition(async () => {
      const res = await completeTicketAction({
        ticketId: completingTicketId,
        repairNotes,
      });

      if (res.success) {
        setCompletingTicketId(null);
        setRepairNotes("");
        router.refresh();
      } else {
        alert(res.error || "办结失败");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">技师抢单与维修工作台</h1>
            <Badge variant="info">
              {role === "ADMIN" ? "管理员模式" : "技师模式"}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            带 CAS 原子状态更新防超卖机制，支持多技师同时并发抢单
          </p>
        </div>
      </div>

      {/* Global claim feedback alert */}
      {claimFeedback && (
        <div
          className={`rounded-lg p-3 text-xs flex items-center gap-2 ${
            claimFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {claimFeedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{claimFeedback.message}</span>
        </div>
      )}

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Open Tickets Pool (抢单池) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              待接单公共工单池 ({initialOpenTickets.length})
            </h2>
            <span className="text-xs text-neutral-400">毫秒级原子防碰撞</span>
          </div>

          {initialOpenTickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-400 text-xs dark:border-neutral-800">
              当前暂无待抢工单，所有求助均已被接单或已解决。
            </div>
          ) : (
            <div className="space-y-3">
              {initialOpenTickets.map((ticket) => (
                <Card key={ticket.id} className="border-amber-200/80 shadow-sm hover:border-amber-300 transition-colors">
                  <CardHeader className="p-4 pb-2 bg-amber-50/40 dark:bg-amber-950/20">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                        {ticket.device_info}
                      </span>
                      <Badge variant="warning" className="text-xs">待接单</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-2">
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {ticket.issue_desc}
                    </p>
                    <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.requester?.name} ({ticket.requester?.student_id})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      size="sm"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                      disabled={isPending}
                      onClick={() => handleClaim(ticket.id)}
                    >
                      {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      <Zap className="mr-1.5 h-3.5 w-3.5" />
                      立即抢单
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: My Active & History Tickets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-600" />
              我承接的维修工单 ({initialMyTickets.length})
            </h2>
          </div>

          {initialMyTickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-400 text-xs dark:border-neutral-800">
              您当前还没有接单，请在左侧工单池点击“立即抢单”认领工单。
            </div>
          ) : (
            <div className="space-y-3">
              {initialMyTickets.map((ticket) => (
                <Card key={ticket.id} className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                        {ticket.device_info}
                      </span>
                      {ticket.status === "COMPLETED" ? (
                        <Badge variant="success">已办结</Badge>
                      ) : (
                        <Badge variant="info">进行中</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-2">
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      {ticket.issue_desc}
                    </p>
                    <div className="rounded bg-neutral-50 p-2 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 flex items-center justify-between">
                      <span>求助同学：{ticket.requester?.name}</span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {ticket.requester?.phone}
                      </span>
                    </div>

                    {ticket.repair_notes && (
                      <div className="text-xs text-emerald-700 bg-emerald-50/70 p-2 rounded dark:bg-emerald-950/30 dark:text-emerald-300">
                        <strong>维修报告：</strong>{ticket.repair_notes}
                      </div>
                    )}
                  </CardContent>

                  {ticket.status === "ACCEPTED" && (
                    <CardFooter className="p-4 pt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => {
                          setCompletingTicketId(ticket.id);
                          setRepairNotes("");
                        }}
                      >
                        <FileCheck2 className="mr-1.5 h-3.5 w-3.5" />
                        办结工单并填写维修报告
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Ticket Modal Dialog */}
      {completingTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base">填写维修结论报告</CardTitle>
              <CardDescription className="text-xs">
                记录排障步骤与最终结果，办结后求助学生可对服务评分
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleComplete}>
              <CardContent className="space-y-3">
                <textarea
                  required
                  rows={4}
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  placeholder="例如: 协助清理风扇灰尘并重新涂抹硅脂，烤机温度恢复正常；或重装Win11专业版并激活驱动..."
                  className="w-full rounded-md border border-neutral-300 p-2.5 text-sm placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompletingTicketId(null)}
                >
                  取消
                </Button>
                <Button type="submit" size="sm" disabled={isPending || repairNotes.length < 3}>
                  {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  确认办结
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
