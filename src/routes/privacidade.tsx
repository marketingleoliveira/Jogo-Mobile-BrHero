import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — BRHero" },
      {
        name: "description",
        content:
          "Política de Privacidade do BRHero, o primeiro RPG idle brasileiro. Saiba quais dados coletamos, como usamos e seus direitos LGPD.",
      },
      { property: "og:title", content: "Política de Privacidade — BRHero" },
      { property: "og:url", content: "https://brhero.lovable.app/privacidade" },
    ],
    links: [{ rel: "canonical", href: "https://brhero.lovable.app/privacidade" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#3E2723] via-[#5D4037] to-[#3E2723] text-amber-50">
      <div className="mx-auto w-full max-w-2xl px-5 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-amber-200 hover:text-amber-100"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1
          className="mb-2 text-4xl text-[#FFE0B2] drop-shadow-[0_3px_0_#1A0F08]"
          style={{ fontFamily: "'Luckiest Guy', cursive" }}
        >
          Política de Privacidade
        </h1>
        <p className="mb-8 text-xs text-amber-200/70">
          Última atualização: 8 de julho de 2026
        </p>

        <div className="space-y-6 rounded-2xl border-4 border-[#8B4513] bg-[#4E342E]/70 p-6 text-sm leading-relaxed text-amber-100">
          <Section title="1. Quem somos">
            BRHero (“nós”, “nosso”, “Jogo”) é um RPG idle mobile brasileiro
            oferecido via navegador e por meio da loja Google Play. Esta
            política descreve como coletamos, usamos e protegemos os dados
            pessoais dos jogadores, em conformidade com a{" "}
            <b>Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</b>.
          </Section>

          <Section title="2. Dados que coletamos">
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <b>Conta Google:</b> nome público, endereço de e-mail, foto de
                perfil e ID único (sub) fornecidos pelo login com Google
                Identity Services.
              </li>
              <li>
                <b>Progresso de jogo:</b> nível, ouro, gemas, atributos,
                estágio atual, equipamentos e desbloqueios, armazenados
                localmente em seu dispositivo (localStorage).
              </li>
              <li>
                <b>Dados técnicos:</b> tipo de dispositivo, navegador, idioma,
                logs de erro anônimos para melhorar a estabilidade.
              </li>
            </ul>
            <p className="mt-2">
              <b>Não coletamos:</b> localização precisa, contatos, fotos,
              microfone, câmera ou dados bancários.
            </p>
          </Section>

          <Section title="3. Como usamos seus dados">
            <ul className="ml-4 list-disc space-y-1">
              <li>Identificar você e salvar seu progresso.</li>
              <li>Permitir recursos multiplayer e ranking (quando disponíveis).</li>
              <li>Comunicar atualizações, eventos e novidades do jogo.</li>
              <li>Prevenir fraudes, trapaças e uso abusivo.</li>
              <li>Cumprir obrigações legais.</li>
            </ul>
          </Section>

          <Section title="4. Compartilhamento com terceiros">
            Compartilhamos dados apenas com parceiros essenciais à operação
            do serviço:
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>
                <b>Google LLC</b> — autenticação (Google Sign-In) e distribuição
                (Google Play).
              </li>
              <li>
                <b>Lovable Cloud (Supabase)</b> — hospedagem e banco de dados.
              </li>
              <li>
                <b>Cloudflare</b> — CDN e proteção contra ataques.
              </li>
            </ul>
            Nunca vendemos seus dados pessoais.
          </Section>

          <Section title="5. Crianças e adolescentes">
            O BRHero é classificado como <b>Livre para todas as idades</b>,
            porém recomendado a partir de <b>10 anos</b>. Menores de 13 anos
            devem ter consentimento dos pais ou responsáveis, conforme o
            Art. 14 da LGPD.
          </Section>

          <Section title="6. Seus direitos (LGPD)">
            Você pode a qualquer momento:
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Confirmar a existência de tratamento dos seus dados.</li>
              <li>Acessar, corrigir ou anonimizar seus dados.</li>
              <li>Solicitar a portabilidade ou eliminação da sua conta.</li>
              <li>Revogar o consentimento e sair do jogo.</li>
            </ul>
            Envie sua solicitação para <b>privacidade@brhero.app</b>.
          </Section>

          <Section title="7. Retenção e segurança">
            Guardamos os dados enquanto sua conta estiver ativa. Após a
            exclusão, seus dados são apagados em até 30 dias, exceto quando
            houver obrigação legal de retenção. Utilizamos criptografia em
            trânsito (HTTPS/TLS) e controle de acesso baseado em função.
          </Section>

          <Section title="8. Cookies e armazenamento local">
            Usamos localStorage do navegador para salvar seu progresso e
            preferências. Não utilizamos cookies de rastreamento publicitário
            de terceiros.
          </Section>

          <Section title="9. Alterações">
            Podemos atualizar esta política. Alterações relevantes serão
            comunicadas dentro do jogo e nesta página.
          </Section>

          <Section title="10. Contato do Encarregado (DPO)">
            E-mail: <b>privacidade@brhero.app</b>
          </Section>
        </div>

        <div className="mt-6 text-center text-xs text-amber-200/60">
          Consulte também nossos{" "}
          <Link to="/termos" className="underline hover:text-amber-100">
            Termos de Serviço
          </Link>
          .
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="mb-2 text-lg text-amber-200"
        style={{ fontFamily: "'Luckiest Guy', cursive" }}
      >
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
