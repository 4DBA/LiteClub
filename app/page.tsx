import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Laptop,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";

export const revalidate = 0; // Dynamic server-rendered

export default async function HomePage() {
  const session = await getSession();

  // Query live metrics
  const [activeBatch, departmentCount, applicantCount, openTicketCount] = await Promise.all([
    db.recruitBatch.findFirst({ where: { is_active: true } }),
    db.department.count(),
    db.recruitApplication.count(),
    db.clinicTicket.count({ where: { status: "CREATED" } }),
  ]);

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-b from-blue-50/70 to-white px-4 py-16 sm:px-6 lg:py-20 dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100/60 px-3.5 py-1 text-xs font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{activeBatch ? `${activeBatch.name} 火热进行中` : "欢迎来到学生组织平台"}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-neutral-900 dark:text-neutral-50">
            {siteConfig.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
            {siteConfig.description}。集招新报名、志愿审批、电脑义诊求助与技师并发抢单于一体的轻量化系统。
          </p>

          {/* Quick Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/recruit">
              <Button size="lg" className="shadow-lg shadow-blue-600/20">
                <Users className="mr-2 h-5 w-5" />
                立即填写招新报名
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>

            <Link href="/clinic">
              <Button size="lg" variant="outline" className="shadow-sm">
                <Laptop className="mr-2 h-5 w-5 text-blue-600" />
                电脑义诊故障报修
              </Button>
            </Link>

            {session && (session.role === "MEMBER" || session.role === "ADMIN") && (
              <Link href="/workbench">
                <Button size="lg" variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <Wrench className="mr-2 h-5 w-5 text-emerald-600" />
                  技师抢单工作台
                  {openTicketCount > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                      {openTicketCount} 单待接
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {session && session.role === "ADMIN" && (
              <Link href="/admin">
                <Button size="lg" variant="secondary">
                  <ShieldCheck className="mr-2 h-5 w-5 text-purple-600" />
                  管理控制台
                </Button>
              </Link>
            )}
          </div>

          {/* Quick login reminder if not logged in */}
          {!session && (
            <div className="mt-6 text-xs text-neutral-500">
              💡 正在本地测试？可直接前往{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                【登录页】
              </Link>{" "}
              体验一秒切换管理员、技师或学生角色
            </div>
          )}
        </div>
      </section>

      {/* Live Data Metrics */}
      <section className="container mx-auto max-w-6xl px-4 -mt-6 sm:px-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 font-medium">当前招新批次</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate mt-0.5">
                  {activeBatch ? activeBatch.name : "暂未开启"}
                </p>
              </div>
              <Clock className="h-7 w-7 text-blue-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 font-medium">开放报名部门</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {departmentCount} <span className="text-xs font-normal text-neutral-500">个</span>
                </p>
              </div>
              <Users className="h-7 w-7 text-emerald-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 font-medium">已提交报名申请</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {applicantCount} <span className="text-xs font-normal text-neutral-500">人</span>
                </p>
              </div>
              <CheckCircle2 className="h-7 w-7 text-purple-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 font-medium">待接单义诊工单</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                  {openTicketCount} <span className="text-xs font-normal text-neutral-500">单</span>
                </p>
              </div>
              <Zap className="h-7 w-7 text-amber-500 opacity-80" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature Overview Cards */}
      <section className="container mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">核心业务功能</h2>
          <p className="text-sm text-neutral-500 mt-1">专为高校学生组织量身打造的端到端管理方案</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 mb-2">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle>招新季志愿直通</CardTitle>
              <CardDescription>第一第二志愿填报与多轮面试进度跟踪</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
              <p>• 支持第一志愿与可选第二志愿分流；</p>
              <p>• 唯一报名约束防重复提交；</p>
              <p>• 报名者可实时查看面试、录取及婉拒状态。</p>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
                <Laptop className="h-5 w-5" />
              </div>
              <CardTitle>电脑义诊维修中心</CardTitle>
              <CardDescription>面向全校师生的免费电脑软硬件故障求助</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
              <p>• 快速登记设备型号与详细故障现象；</p>
              <p>• 维修进展全程透明，可查看接单技师信息；</p>
              <p>• 修复完毕后支持对义诊服务进行 1-5 星满意度评价。</p>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 mb-2">
                <Zap className="h-5 w-5" />
              </div>
              <CardTitle>技师高并发抢单台</CardTitle>
              <CardDescription>带 CAS 条件的原子更新防超卖保障</CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
              <p>• 公共待接工单池，技术骨干实时抢单；</p>
              <p>• 严格 SQLite WAL 模式短事务原子锁；</p>
              <p>• 毫秒级防碰撞：已被接单实时抛出友好提示。</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
