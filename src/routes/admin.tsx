import { createFileRoute, Outlet, Link, useRouterState, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import brheroLogo from "@/assets/brhero-logo.png.asset.json";
import { LogOut } from "lucide-react";

import {
  LayoutDashboard,
  Users,
  Coins,
  CalendarClock,
  ShoppingBag,
  Ticket,
  Package,
  Sliders,
  Radio,
  ScrollText,
  Smartphone,
  Shield,
  Search,
  Bell,
  CreditCard,

} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, type AdminRole } from "@/lib/admin/rbac";


export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Gate: apenas admins autenticados podem acessar /admin/*
    // Exceção: /admin/setup deve permanecer aberta para o bootstrap inicial.
    if (location.pathname.startsWith("/admin/setup")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw redirect({ to: "/admin/setup" });
    }
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      throw redirect({ to: "/admin/setup" });
    }
  },
  head: () => ({
    meta: [
      { title: "BRHero Admin — Game Master Panel" },
      { name: "robots", content: "noindex,nofollow" },
      {
        name: "description",
        content: "Painel administrativo BRHero: jogadores, economia, eventos, loja e LiveOps.",
      },
    ],
  }),
  component: AdminLayout,

});


type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};
const NAV: NavItem[] = [
  { to: "/admin",              label: "Dashboard",     icon: LayoutDashboard, exact: true },
  { to: "/admin/players",      label: "Jogadores",     icon: Users },
  { to: "/admin/economy",      label: "Economia",      icon: Coins },
  { to: "/admin/events",       label: "Eventos",       icon: CalendarClock },
  { to: "/admin/shop",         label: "Loja",          icon: ShoppingBag },
  { to: "/admin/payments",     label: "Pagamentos",    icon: CreditCard },
  { to: "/admin/codes",        label: "Códigos",       icon: Ticket },

  { to: "/admin/items",        label: "Itens",         icon: Package },
  { to: "/admin/balancing",    label: "Balanceamento", icon: Sliders },
  { to: "/admin/liveops",      label: "LiveOps",       icon: Radio },
  { to: "/admin/logs",         label: "Logs",          icon: ScrollText },
  { to: "/admin/apk",          label: "APK",           icon: Smartphone },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  // Rota de login não deve exibir sidebar/header nem qualquer informação do painel.
  if (pathname.startsWith("/admin/setup")) {
    return <Outlet />;
  }
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50 text-slate-800">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 overflow-x-hidden p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      <SidebarHeader className="border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <img src={brheroLogo.url} alt="BRHero" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-wide text-slate-900">BRHero</span>
            <span className="text-[10px] uppercase tracking-widest text-indigo-600">
              Admin CMS
            </span>
          </div>
        </div>
      </SidebarHeader>


      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500">Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = isActive(item.to, item.exact);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className="text-slate-700 data-[active=true]:bg-indigo-50 data-[active=true]:text-indigo-700 data-[active=true]:border data-[active=true]:border-indigo-200 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Link to={item.to} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-slate-500 group-data-[collapsible=icon]:hidden">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/40" />
          <span>Beta v0.1</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminHeader() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const current = NAV.find((n) => (n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/"))) ?? NAV[0];
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-3 backdrop-blur md:px-4">
      <SidebarTrigger className="text-slate-600 hover:bg-slate-100 hover:text-slate-900" />
      <div className="flex items-center gap-2">
        <current.icon className="h-4 w-4 text-indigo-600" />
        <h1 className="text-sm font-bold tracking-wide text-slate-900">{current.label}</h1>
        <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[10px] font-bold uppercase tracking-widest text-indigo-700">
          Live
        </Badge>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar jogador, código, item…"
            className="h-9 w-64 border-slate-200 bg-white pl-8 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-500"
          />
        </div>
        <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900">
          <Bell className="h-4 w-4" />
        </Button>
        <AdminProfileSelector />

      </div>
    </header>
  );
}


function AdminProfileSelector() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setEmail(user.email ?? "");
      const [{ data: profile }, { data: roleData }] = await Promise.all([
        supabase.from("admin_profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.rpc("get_admin_role", { _user_id: user.id }),
      ]);
      if (cancelled) return;
      setName(profile?.display_name ?? user.email ?? "Admin");
      setRole((roleData as AdminRole | null) ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  const initials = (name || email || "AD").slice(0, 2).toUpperCase();
  const roleLabel = role ? ROLE_LABEL[role] : "Admin";

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/setup";
  };

  return (
    <div className="hidden items-center gap-2 rounded-lg border border-indigo-200 bg-white px-2 py-1 md:flex">
      <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-[10px] font-bold text-white">
        {initials}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-bold text-slate-900">{name || "Carregando…"}</span>
        <span className="text-[9px] uppercase tracking-widest text-indigo-600">
          {roleLabel}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={signOut}
        title="Sair"
        className="ml-1 h-7 w-7 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <LogOut className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}


