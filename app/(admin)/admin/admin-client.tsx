"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationStatusAction } from "@/server/actions/recruit";
import { RecruitApplicationItem, ClinicTicketItem, RecruitStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Users, Laptop, Loader2 } from "lucide-react";

interface AdminClientViewProps {
  initialApplications: RecruitApplicationItem[];
  initialTickets: ClinicTicketItem[];
}

export function AdminClientView({
  initialApplications,
  initialTickets,
}: AdminClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"recruit" | "clinic">("recruit");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Status update dialog state
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<RecruitStatus>(RecruitStatus.PENDING);
  const [adminNotes, setAdminNotes] = useState("");

  const filteredApplications = initialApplications.filter((app) => {
    if (statusFilter === "ALL") return true;
    return app.status === statusFilter;
  });

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppId) return;

    startTransition(async () => {
      const res = await updateApplicationStatusAction({
        applicationId: editingAppId,
        status: selectedStatus,
        adminNotes: adminNotes || undefined,
      });

      if (res.success) {
        setEditingAppId(null);
        router.refresh();
      } else {
        alert(res.error || "状态更新失败");
      }
    });
  };

  const getRecruitBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <Badge variant="success">已录取</Badge>;
      case "INTERVIEWING":
        return <Badge variant="info">面试中</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">婉拒</Badge>;
      default:
        return <Badge variant="warning">待筛选</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-purple-600" />
            管理控制台
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            招新面试全流程推进、部门人员分配与全量义诊数据归档
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab("recruit")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "recruit"
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-neutral-100"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            招新申请审核 ({initialApplications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("clinic")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "clinic"
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-neutral-100"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            义诊工单全览 ({initialTickets.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Recruit Applications Review */}
      {activeTab === "recruit" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500">状态筛选：</span>
              {["ALL", "PENDING", "INTERVIEWING", "ACCEPTED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === st
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                  }`}
                >
                  {st === "ALL" && "全部"}
                  {st === "PENDING" && "待筛选"}
                  {st === "INTERVIEWING" && "面试中"}
                  {st === "ACCEPTED" && "已录取"}
                  {st === "REJECTED" && "婉拒"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                <tr>
                  <th className="p-3.5 font-semibold">申请学生</th>
                  <th className="p-3.5 font-semibold">联系电话</th>
                  <th className="p-3.5 font-semibold">第一志愿</th>
                  <th className="p-3.5 font-semibold">第二志愿</th>
                  <th className="p-3.5 font-semibold">自述简介</th>
                  <th className="p-3.5 font-semibold">当前状态</th>
                  <th className="p-3.5 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-400">
                      暂无符合条件的报名记录
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50">
                      <td className="p-3.5 font-medium text-neutral-900 dark:text-neutral-100">
                        {app.user?.name}
                        <span className="block text-[11px] text-neutral-400 font-normal">
                          {app.user?.student_id}
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-600 dark:text-neutral-300">
                        {app.user?.phone}
                      </td>
                      <td className="p-3.5 font-semibold text-blue-700 dark:text-blue-400">
                        {app.first_choice?.name}
                      </td>
                      <td className="p-3.5 text-neutral-500">
                        {app.second_choice?.name || "-"}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-neutral-600 dark:text-neutral-300" title={app.intro_text}>
                        {app.intro_text}
                      </td>
                      <td className="p-3.5">
                        {getRecruitBadge(app.status)}
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2.5"
                          onClick={() => {
                            setEditingAppId(app.id);
                            setSelectedStatus(app.status as RecruitStatus);
                            setAdminNotes(app.admin_notes || "");
                          }}
                        >
                          审批 / 备注
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Clinic Tickets Overview */}
      {activeTab === "clinic" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                <tr>
                  <th className="p-3.5 font-semibold">工单设备</th>
                  <th className="p-3.5 font-semibold">故障描述</th>
                  <th className="p-3.5 font-semibold">求助学生</th>
                  <th className="p-3.5 font-semibold">负责技师</th>
                  <th className="p-3.5 font-semibold">工单状态</th>
                  <th className="p-3.5 font-semibold">满意度评分</th>
                  <th className="p-3.5 font-semibold">提交时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {initialTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-400">
                      暂无工单记录
                    </td>
                  </tr>
                ) : (
                  initialTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/50">
                      <td className="p-3.5 font-medium text-neutral-900 dark:text-neutral-100">
                        {t.device_info}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-neutral-600 dark:text-neutral-300" title={t.issue_desc}>
                        {t.issue_desc}
                      </td>
                      <td className="p-3.5 text-neutral-700 dark:text-neutral-300">
                        {t.requester?.name} ({t.requester?.phone})
                      </td>
                      <td className="p-3.5 text-neutral-700 dark:text-neutral-300">
                        {t.technician ? `${t.technician.name}` : <span className="text-amber-500">待接单</span>}
                      </td>
                      <td className="p-3.5">
                        {t.status === "COMPLETED" && <Badge variant="success">已解决</Badge>}
                        {t.status === "ACCEPTED" && <Badge variant="info">处理中</Badge>}
                        {t.status === "CREATED" && <Badge variant="warning">待接单</Badge>}
                      </td>
                      <td className="p-3.5 text-amber-500 font-semibold">
                        {t.rating ? `★ ${t.rating} 星` : "-"}
                      </td>
                      <td className="p-3.5 text-neutral-400">
                        {new Date(t.created_at).toLocaleDateString("zh-CN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-base">招新申请流转与备注</CardTitle>
              <CardDescription className="text-xs">
                更新该学生的招新状态或添加内部面试打分记录
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateStatus}>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    流转状态
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as RecruitStatus)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                  >
                    <option value={RecruitStatus.PENDING}>PENDING (待筛选)</option>
                    <option value={RecruitStatus.INTERVIEWING}>INTERVIEWING (面试中)</option>
                    <option value={RecruitStatus.ACCEPTED}>ACCEPTED (正式录取)</option>
                    <option value={RecruitStatus.REJECTED}>REJECTED (婉拒)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    面试官内部备注 (仅管理员可见)
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="例如: 技术基础扎实，建议分配进全栈开发组..."
                    className="w-full rounded-md border border-neutral-300 p-2 text-sm placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAppId(null)}
                >
                  取消
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  保存更新
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
