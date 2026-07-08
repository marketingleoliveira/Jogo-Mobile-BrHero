import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Smartphone, Bell, Mail, ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Em breve | Seu novo app mobile" },
      {
        name: "description",
        content:
          "Estamos construindo algo incrível para o seu celular. Cadastre-se para ser avisado do lançamento.",
      },
      { property: "og:title", content: "Em breve | Seu novo app mobile" },
      {
        property: "og:description",
        content:
          "Estamos construindo algo incrível para o seu celular. Cadastre-se para ser avisado do lançamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Smartphone className="h-8 w-8" aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Seu novo app está chegando
        </h1>

        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Estamos construindo uma experiência simples e poderosa para o seu
          celular. Deixe seu e-mail e seja o primeiro a saber quando
          lançarmos.
        </p>

        <div className="mt-8 w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-lg font-medium text-card-foreground">
                Você está na lista!
              </p>
              <p className="text-sm text-muted-foreground">
                Avisamos assim que o app estiver disponível.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none ring-ring transition-shadow placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                Avise-me no lançamento
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Projeto em construção. Versão mobile em breve.
        </p>
      </div>
    </main>
  );
}
