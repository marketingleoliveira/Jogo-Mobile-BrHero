import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
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
  Shield,
  Search,
  Bell,
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AVAILABLE_PROFILES, ROLE_LABEL, getCurrentAdmin, setCurrentAdmin, subscribeAdmin,
} from "@/lib/admin/rbac";

export const Route = createFileRoute("/admin")({
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
  { to: "/admin/codes",        label: "Códigos",       icon: Ticket },
  { to: "/admin/items",        label: "Itens",         icon: Package },
  { to: "/admin/balancing",    label: "Balanceamento", icon: Sliders },
  { to: "/admin/liveops",      label: "LiveOps",       icon: Radio },
  { to: "/admin/logs",         label: "Logs",          icon: ScrollText },
];

function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
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
    <Sidebar collapsible="icon" className="border-r border-slate-800 bg-slate-900">
      <SidebarHeader className="border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950 shadow">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-black tracking-wide">BRHero</span>
            <span className="text-[10px] uppercase tracking-widest text-amber-400">
              Admin CMS
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-slate-900">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400">Módulos</SidebarGroupLabel>
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
                      className="data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-300 data-[active=true]:border data-[active=true]:border-amber-500/30 hover:bg-slate-800 hover:text-slate-100"
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

      <SidebarFooter className="border-t border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-slate-400 group-data-[collapsible=icon]:hidden">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60" />
          <span>Beta v0.1 · mock data</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminHeader() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const current = NAV.find((n) => (n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/"))) ?? NAV[0];
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-3 backdrop-blur md:px-4">
      <SidebarTrigger className="text-slate-300 hover:bg-slate-800 hover:text-white" />
      <div className="flex items-center gap-2">
        <current.icon className="h-4 w-4 text-amber-400" />
        <h1 className="text-sm font-bold tracking-wide text-slate-100">{current.label}</h1>
        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-[10px] font-bold uppercase tracking-widest text-amber-300">
          Mock
        </Badge>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Buscar jogador, código, item…"
            className="h-9 w-64 border-slate-800 bg-slate-900 pl-8 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-amber-500"
          />
        </div>
        <Button variant="outline" size="icon" className="h-9 w-9 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white">
          <Bell className="h-4 w-4" />
        </Button>
        <AdminProfileSelector />

      </div>
    </header>
  );
}
