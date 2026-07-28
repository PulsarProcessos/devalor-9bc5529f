import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dê Valor · Planejamento Financeiro" },
      { name: "description", content: "Ferramenta de planejamento financeiro Dê Valor." },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    // cache-buster: garante que o navegador sempre receba a versão mais recente
    window.location.replace(`/tool.html?v=${Date.now()}`);
  }, []);
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", color: "#745341" }}>
      Carregando Dê Valor…
    </div>
  );
}
