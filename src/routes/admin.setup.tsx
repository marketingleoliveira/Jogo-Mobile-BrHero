import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { claimSuperAdmin, getRemoteAdmin, isSupabaseAdminAvailable, resetSupabaseAdminCache, type RemoteAdmin } from "@/lib/admin/supabase-admin";
import { ROLE_LABEL } from "@/lib/admin/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/setup")({
  component: AdminSetupPage,
});

function AdminSetupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [remote, setRemote] = useState<RemoteAdmin | null>(null);
  const [available, setAvailable] = useState<boolean>(false);
  const [session, setSession] = useState<{ email: string; id: string } | null>(null);

  async function refresh() {
    resetSupabaseAdminCache();
    const { data: { session: s } } = await supabase.auth.getSession();
    setSession(s ? { email: s.user.email ?? "", id: s.user.id } : null);
    setAvailable(await isSupabaseAdminAvailable());
    setRemote(await getRemoteAdmin());
  }

  useEffect(() => {
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void refresh());
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/admin/setup` },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada. Faça login se o e-mail não for auto-confirmado.");
  }

  async function handleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Autenticado.");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada.");
  }

  async function handleClaim() {
    setLoading(true);
    const res = await claimSuperAdmin(displayName || undefined);
    setLoading(false);
    if (!res.ok) toast.error(res.error ?? "Falha ao reivindicar Super Admin");
    else {
      toast.success("Super Admin ativo.");
      void refresh();
    }
  }

  return (
    <div className="container max-w-2xl py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Admin CMS — Bootstrap Backend</h1>
        <p className="text-muted-foreground">
          Fase 1 Supabase: autentique e reivindique o Super Admin inicial. Nenhuma alteração afeta o jogo.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Status do Backend</CardTitle>
          <CardDescription>Sessão atual e vínculo com o Admin CMS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sessão:</span>
            {session
              ? <Badge variant="secondary">{session.email}</Badge>
              : <Badge variant="outline">não autenticado</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Admin CMS:</span>
            {available && remote
              ? <Badge>{ROLE_LABEL[remote.role]} — {remote.displayName}</Badge>
              : <Badge variant="outline">mock local (fallback)</Badge>}
          </div>
        </CardContent>
      </Card>

      {!session && (
        <Card>
          <CardHeader>
            <CardTitle>1. Autenticar</CardTitle>
            <CardDescription>Crie ou use uma conta para vincular ao Admin CMS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSignIn} disabled={loading || !email || !password}>Entrar</Button>
              <Button variant="outline" onClick={handleSignUp} disabled={loading || !email || !password}>Criar conta</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {session && !remote && (
        <Card>
          <CardHeader>
            <CardTitle>2. Reivindicar Super Admin</CardTitle>
            <CardDescription>Disponível apenas se nenhum Super Admin existir ainda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Nome de exibição</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="GM.Root" />
            </div>
            <Button onClick={handleClaim} disabled={loading}>Reivindicar Super Admin</Button>
          </CardContent>
        </Card>
      )}

      {session && remote && (
        <Alert>
          <AlertTitle>Super Admin vinculado</AlertTitle>
          <AlertDescription>
            Você é {ROLE_LABEL[remote.role]} no backend. Logs de auditoria estão sendo persistidos
            no Supabase em paralelo ao armazenamento local.
          </AlertDescription>
        </Alert>
      )}

      {session && (
        <div>
          <Button variant="ghost" onClick={handleSignOut}>Sair</Button>
        </div>
      )}
    </div>
  );
}
