"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { SessionPayload } from "@/lib/session";
import { logoutAction } from "@/server/actions/auth";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Wrench,
  UserCheck,
  ShieldCheck,
  LogOut,
  LogIn,
  Menu,
  X,
  Laptop,
  Users,
} from "lucide-react";

interface NavbarProps {
  initialUser: SessionPayload | null;
}

export function Navbar({ initialUser }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = initialUser;

  const handleLogout = async () => {
    await logoutAction();
    router.refresh();
    router.push("/login");
  };

  const navItems = [
    { label: "首页", href: "/" },
    { label: "招新报名", href: "/recruit", icon: Users },
    { label: "义诊求助", href: "/clinic", icon: Laptop },
    ...(user && (user.role === "MEMBER" || user.role === "ADMIN")
      ? [{ label: "技师抢单台", href: "/workbench", icon: Wrench }]
      : []),
    ...(user && user.role === "ADMIN"
      ? [{ label: "管理后台", href: "/admin", icon: ShieldCheck }]
      : []),
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive">管理员</Badge>;
      case "MEMBER":
        return <Badge variant="info">技术干部/技师</Badge>;
      default:
        return <Badge variant="secondary">学生</Badge>;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-50 hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-sm">
              LC
            </div>
            <span className="hidden sm:inline-block">{siteConfig.name}</span>
            <span className="sm:hidden">{siteConfig.shortName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side user info / auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {user.name}
                </span>
                <span className="text-xs text-neutral-400">({user.studentId})</span>
                {getRoleBadge(user.role)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-neutral-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-1" />
                退出
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  <LogIn className="h-4 w-4 mr-1" />
                  登录 / 快速体验
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">注册</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === item.href
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50"
                    : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300"
                }`}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
            {user ? (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{user.name} ({user.studentId})</span>
                  {getRoleBadge(user.role)}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                  <LogOut className="h-4 w-4 mr-1" />
                  退出登录
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    登录 / 体验
                  </Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">
                    注册
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
