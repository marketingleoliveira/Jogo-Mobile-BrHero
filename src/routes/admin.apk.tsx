import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Download, RefreshCw, FileArchive } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/apk")({
  component: AdminApkPage,
});

const BUCKET = "apk";
const OBJECT = "latest.apk";
const APK_MIME = "application/vnd.android.package-archive";
const PUBLIC_DOWNLOAD_PATH = "/api/public/apk";

type ApkInfo = {
  updatedAt: string | null;
  size: number | null;
};

function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function AdminApkPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [info, setInfo] = useState<ApkInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoadingInfo(true);
    const { data: { session } } = await supabase.auth.getSession();
    setSignedIn(!!session);
    if (!session) { setInfo(null); setLoadingInfo(false); return; }
    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      limit: 100, search: OBJECT,
    });
    if (error) {
      toast.error(`Falha ao listar: ${error.message}`);
      setInfo(null);
    } else {
      const file = data?.find((f) => f.name === OBJECT);
      setInfo(file
        ? { updatedAt: file.updated_at ?? file.created_at ?? null, size: (file.metadata?.size as number) ?? null }
        : { updatedAt: null, size: null });
    }
    setLoadingInfo(false);
  }

  useEffect(() => {
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void refresh());
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleFile(file: File) {
    if (!/\.apk$/i.test(file.name)) {
      toast.error("Selecione um arquivo .apk");
      return;
    }
    setUploading(true);
    setProgress(10);
    try {
      // Reenvia como Blob com o content-type correto — mesmo que o navegador
      // detecte o .apk como application/zip ou octet-stream, aqui gravamos com
      // application/vnd.android.package-archive para que o Android reconheça
      // como instalador ao baixar.
      const arrayBuffer = await file.arrayBuffer();
      setProgress(40);
      const blob = new Blob([arrayBuffer], { type: APK_MIME });
      setProgress(60);
      const { error } = await supabase.storage.from(BUCKET).upload(OBJECT, blob, {
        contentType: APK_MIME,
        upsert: true,
        cacheControl: "0",
      });
      if (error) throw error;
      setProgress(100);
      toast.success("APK enviado com sucesso!");
      await refresh();
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">APK do Jogo</h1>
        <p className="text-sm text-muted-foreground">
          Faça upload do APK Android. O arquivo é armazenado com o Content-Type correto
          (<code>application/vnd.android.package-archive</code>) e servido publicamente em{" "}
          <code>{PUBLIC_DOWNLOAD_PATH}</code>, que é o endereço usado pelo botão "Baixar o Jogo" na landing page.
        </p>
      </div>

      {!signedIn && (
        <Alert>
          <AlertTitle>Login admin necessário</AlertTitle>
          <AlertDescription>
            Autentique-se em <a href="/admin/setup" className="underline">/admin/setup</a> antes de fazer upload.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" /> APK atual
          </CardTitle>
          <CardDescription>Metadados do último APK publicado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {loadingInfo ? (
            <p>Carregando…</p>
          ) : info?.updatedAt ? (
            <>
              <div><span className="text-muted-foreground">Atualizado em:</span> {new Date(info.updatedAt).toLocaleString("pt-BR")}</div>
              <div><span className="text-muted-foreground">Tamanho:</span> {formatSize(info.size)}</div>
              <div className="flex gap-2 pt-2">
                <Button asChild variant="secondary" size="sm">
                  <a href={PUBLIC_DOWNLOAD_PATH} download="brhero.apk">
                    <Download className="mr-2 h-4 w-4" /> Baixar cópia
                  </a>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void refresh()}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Recarregar
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Nenhum APK enviado ainda.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Enviar novo APK
          </CardTitle>
          <CardDescription>
            Selecione o arquivo <code>.apk</code>. Ele substitui o instalador anterior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            disabled={!signedIn || uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-accent"
          />
          {uploading && (
            <div className="h-2 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            O upload usa a chave publicável (RLS) — apenas usuários autenticados podem enviar.
            O download público é servido via rota do servidor, então funciona sem login.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
