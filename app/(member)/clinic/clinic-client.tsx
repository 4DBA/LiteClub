"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTicketAction, rateTicketAction } from "@/server/actions/clinic";
import { ClinicTicketItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Laptop, Star, Loader2, Wrench } from "lucide-react";

interface ClinicClientViewProps {
  initialTickets: ClinicTicketItem[];
}

export function ClinicClientView({ initialTickets }: ClinicClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [deviceInfo, setDeviceInfo] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await createTicketAction({ deviceInfo, issueDesc });
      if (res.success) {
        setSuccessMsg("报修工单已提交！技术部技师将尽快在工作台接单排查。");
        setDeviceInfo("");
        setIssueDesc("");
        router.refresh();
      } else {
        setErrorMsg(res.error || "提交失败");
      }
    });
  };

  const handleRate = (ticketId: string, rating: number) => {
    startTransition(async () => {
      const res = await rateTicketAction({ ticketId, rating });
      if (res.success) {
        router.refresh();
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">已维修解决</Badge>;
      case "ACCEPTED":
        return <Badge variant="info">技师已接单处理中</Badge>;
      default:
        return <Badge variant="warning">待技师接单</Badge>;
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">电脑义诊求助中心</h1>
        <p className="text-sm text-neutral-500 mt-1">面向全校师生的免费电脑软硬件检测与排障支持</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Submit Ticket Form */}
        <div className="md:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Laptop className="h-4 w-4 text-blue-600" />
                登记故障设备
              </CardTitle>
              <CardDescription className="text-xs">
                详细填写型号与现象，便于技师提前准备工具镜像
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateTicket}>
              <CardContent className="space-y-3">
                {errorMsg && (
                  <div className="rounded-md bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="rounded-md bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:bg-emerald-950/40">
                    {successMsg}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    设备型号
                  </label>
                  <input
                    type="text"
                    required
                    value={deviceInfo}
                    onChange={(e) => setDeviceInfo(e.target.value)}
                    placeholder="如: 联想小新Pro 16 / M1 Mac"
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    故障现象描述
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={issueDesc}
                    onChange={(e) => setIssueDesc(e.target.value)}
                    placeholder="例如: 开机蓝屏提示无法启动、风扇异响、需要协助安装双系统等..."
                    className="w-full rounded-md border border-neutral-300 bg-white p-2.5 text-sm placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" size="sm" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  提交义诊申请
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right column: My Tickets List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
              我的工单记录 ({initialTickets.length})
            </h2>
          </div>

          {initialTickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-800">
              <Laptop className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
              <p className="text-sm font-medium">暂无报修工单</p>
              <p className="text-xs text-neutral-400 mt-1">
                若电脑遇到蓝屏、清灰、重装系统等问题，可在左侧直接提交
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {initialTickets.map((ticket) => (
                <Card key={ticket.id} className="overflow-hidden">
                  <CardHeader className="bg-neutral-50/50 pb-3 dark:bg-neutral-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                          {ticket.device_info}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {new Date(ticket.created_at).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-3">
                    <div>
                      <span className="text-xs text-neutral-400">故障描述</span>
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 mt-0.5">
                        {ticket.issue_desc}
                      </p>
                    </div>

                    {/* Technician info */}
                    {ticket.technician && (
                      <div className="flex items-center gap-2 rounded-md bg-blue-50/70 px-3 py-2 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                        <Wrench className="h-3.5 w-3.5 text-blue-600" />
                        <span>接单技师：<strong>{ticket.technician.name}</strong></span>
                        {ticket.technician.phone && <span>(联系电话: {ticket.technician.phone})</span>}
                      </div>
                    )}

                    {/* Repair Notes */}
                    {ticket.repair_notes && (
                      <div className="rounded-md bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <div className="font-semibold mb-0.5">技师维修报告：</div>
                        <div>{ticket.repair_notes}</div>
                      </div>
                    )}

                    {/* Rating if completed */}
                    {ticket.status === "COMPLETED" && (
                      <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500">
                          {ticket.rating ? "我的评分" : "为本次维修服务打分"}：
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRate(ticket.id, star)}
                              className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  ticket.rating && ticket.rating >= star
                                    ? "fill-amber-400"
                                    : "text-neutral-300 dark:text-neutral-600"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
