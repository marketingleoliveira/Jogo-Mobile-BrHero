import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Serviço — BRHero" },
      {
        name: "description",
        content:
          "Termos de Serviço do BRHero, o primeiro RPG idle brasileiro. Regras de uso, conta, compras, condutas proibidas e limites de responsabilidade.",
      },
      { property: "og:title", content: "Termos de Serviço — BRHero" },
      { property: "og:url", content: "https://brhero.lovable.app/termos" },
    ],
    links: [{ rel: "canonical", href: "https://brhero.lovable.app/termos" }],
  }),
  component: TermsPage,
});

function TermsPage() {
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
          Termos de Serviço
        </h1>
        <p className="mb-8 text-xs text-amber-200/70">
          Última atualização: 8 de julho de 2026
        </p>

        <div className="space-y-6 rounded-2xl border-4 border-[#8B4513] bg-[#4E342E]/70 p-6 text-sm leading-relaxed text-amber-100">
          <Section title="1. Aceite dos termos">
            Ao criar uma conta, acessar ou jogar BRHero, você concorda com
            estes Termos de Serviço e com a nossa{" "}
            <Link to="/privacidade" className="underline">
              Política de Privacidade
            </Link>
            . Se não concordar, não utilize o jogo.
          </Section>

          <Section title="2. Elegibilidade">
            Você deve ter no mínimo <b>13 anos</b>. Menores devem ter
            supervisão de pais ou responsáveis. É proibido criar múltiplas
            contas para obter vantagens injustas.
          </Section>

          <Section title="3. Conta do jogador">
            <ul className="ml-4 list-disc space-y-1">
              <li>Autenticação obrigatória via conta Google.</li>
              <li>
                Você é responsável por manter a segurança da sua conta Google.
              </li>
              <li>
                Podemos suspender ou encerrar contas que violem estes Termos.
              </li>
            </ul>
          </Section>

          <Section title="4. Licença de uso">
            Concedemos a você uma licença <b>pessoal, limitada, não exclusiva,
            intransferível e revogável</b> para jogar BRHero para fins de
            entretenimento pessoal. Todos os direitos autorais, marca,
            arte, código, sprites, música e mecânicas pertencem à equipe
            BRHero.
          </Section>

          <Section title="5. Itens virtuais e moedas do jogo">
            Ouro, gemas, equipamentos, personagens, passes e demais itens
            virtuais <b>não têm valor monetário real</b>, não podem ser
            trocados fora do jogo, sacados ou reembolsados em dinheiro. Podem
            ser modificados, removidos ou reajustados para manter o equilíbrio
            do jogo.
          </Section>

          <Section title="6. Compras dentro do jogo">
            Compras feitas via Google Play são processadas por Google LLC
            conforme os termos daquela loja. Reembolsos seguem as políticas
            da Google Play. Compras concluídas não são reembolsáveis por
            nós, salvo obrigação legal (CDC — Código de Defesa do Consumidor,
            Lei 8.078/1990).
          </Section>

          <Section title="7. Condutas proibidas">
            É proibido:
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Usar bots, hacks, cheats, emuladores modificados ou automações.</li>
              <li>Explorar bugs ou falhas para obter vantagens.</li>
              <li>Vender, comprar ou transferir contas ou itens por dinheiro real.</li>
              <li>
                Assediar, ameaçar ou discriminar outros jogadores em chats,
                nomes ou clãs.
              </li>
              <li>Fazer engenharia reversa, descompilar ou minerar o código.</li>
            </ul>
            Violações podem resultar em suspensão temporária ou banimento
            permanente sem reembolso.
          </Section>

          <Section title="8. Conteúdo do usuário">
            Nomes de herói, clã e mensagens de chat são de sua
            responsabilidade. Podemos moderar, ocultar ou remover conteúdo
            ofensivo ou ilegal.
          </Section>

          <Section title="9. Disponibilidade e alterações">
            O jogo é fornecido “no estado em que se encontra”. Podemos
            alterar, suspender ou descontinuar recursos, servidores ou o
            jogo inteiro a qualquer momento, com aviso razoável quando
            possível.
          </Section>

          <Section title="10. Limitação de responsabilidade">
            Na máxima extensão permitida pela lei brasileira, não somos
            responsáveis por perdas indiretas, lucros cessantes, danos morais
            decorrentes de interrupções, perda de progresso por falha de
            dispositivo do usuário, ou uso indevido da conta por terceiros.
          </Section>

          <Section title="11. Legislação e foro">
            Estes Termos são regidos pelas leis da <b>República Federativa
            do Brasil</b>. Fica eleito o foro da comarca do domicílio do
            consumidor para dirimir controvérsias.
          </Section>

          <Section title="12. Contato">
            Dúvidas: <b>contato@brhero.app</b>
          </Section>
        </div>

        <div className="mt-6 text-center text-xs text-amber-200/60">
          Consulte também nossa{" "}
          <Link to="/privacidade" className="underline hover:text-amber-100">
            Política de Privacidade
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
