import { createFileRoute } from "@tanstack/react-router";

const CATS_EXTRA = [
  { key: "fixas", lbl: "Obrigatórias Fixas", group: "obrigatorias" },
  { key: "variaveis", lbl: "Obrigatórias Variáveis", group: "obrigatorias" },
  { key: "naoobl", lbl: "Não Obrigatórias", group: "naoobl" },
  { key: "invest", lbl: "Investimentos", group: "invest" },
] as const;

function groupOfLabel(label: string): "obrigatorias" | "naoobl" | "invest" | null {
  const norm = String(label || "").toLowerCase();
  if (norm.includes("obrigat")) return "obrigatorias";
  if (norm.includes("invest")) return "invest";
  if (norm.includes("não") || norm.includes("nao")) return "naoobl";
  return null;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleAction(action: string, params: Record<string, any>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const clienteId: string | null = params.clienteId || null;

  if (action === "login") {
    const { email, senha } = params;
    const { data: u } = await supabaseAdmin
      .from("usuarios")
      .select("*")
      .ilike("email", String(email || ""))
      .maybeSingle();
    if (!u || u.senha !== String(senha || "")) {
      return json({ error: "E-mail ou senha inválidos." });
    }
    return json({
      ok: true,
      user: {
        nome: u.nome,
        email: u.email,
        role: u.role,
        clienteId: u.cliente_id || u.id,
        perfil: u.role,
      },
    });
  }

  if (action === "getClientes") {
    const { data } = await supabaseAdmin
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });
    const clientes = (data || []).map((c) => ({
      clienteId: c.cliente_id,
      nome: c.nome,
      email: c.email,
      telefone: c.telefone,
      perfil: "cliente",
    }));
    return json({ ok: true, clientes });
  }

  if (action === "createCliente") {
    const d = params.data || {};
    const nome = String(d.nome || "").trim();
    const email = String(d.email || "").trim().toLowerCase();
    const senha = String(d.senha || "");
    if (!nome || !email || !senha) return json({ error: "Dados incompletos." });
    const { data: existing } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (existing) return json({ error: "E-mail já cadastrado." });
    const cid =
      "C" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 6).toUpperCase();
    await supabaseAdmin.from("clientes").insert({
      cliente_id: cid,
      nome,
      email,
      telefone: d.telefone || null,
      data: d,
    });
    await supabaseAdmin.from("usuarios").insert({
      email,
      senha,
      nome,
      role: "cliente",
      cliente_id: cid,
    });
    return json({ ok: true, clienteId: cid });
  }

  if (action === "deleteCliente") {
    const cid = params.clienteId;
    if (!cid) return json({ error: "clienteId obrigatório." });
    await supabaseAdmin.from("entries").delete().eq("cliente_id", cid);
    await supabaseAdmin.from("usuarios").delete().eq("cliente_id", cid);
    await supabaseAdmin.from("clientes").delete().eq("cliente_id", cid);
    return json({ ok: true });
  }

  if (!clienteId) return json({ error: "Cliente não selecionado." });

  if (action === "savePerfil") {
    await supabaseAdmin
      .from("entries")
      .delete()
      .eq("cliente_id", clienteId)
      .eq("sheet", "Perfil");
    await supabaseAdmin
      .from("entries")
      .insert({ cliente_id: clienteId, sheet: "Perfil", data: params.data || {} });
    return json({ ok: true });
  }

  if (action === "saveRenda") {
    await supabaseAdmin
      .from("entries")
      .delete()
      .eq("cliente_id", clienteId)
      .eq("sheet", "Renda e Planejamento");
    await supabaseAdmin.from("entries").insert({
      cliente_id: clienteId,
      sheet: "Renda e Planejamento",
      data: params.data || {},
    });
    return json({ ok: true });
  }

  if (action === "appendRows") {
    const sheet = String(params.sheet || "");
    const rows = Array.isArray(params.rows) ? params.rows : [];
    if (!sheet || !rows.length) return json({ error: "sheet/rows obrigatórios." });
    const records = rows.map((r: any) => ({
      cliente_id: clienteId,
      sheet,
      data: { row: r },
    }));
    const { error } = await supabaseAdmin.from("entries").insert(records);
    if (error) return json({ error: error.message });
    return json({ ok: true, count: rows.length });
  }

  if (action === "getRows") {
    const sheet = String(params.sheet || "");
    const { data } = await supabaseAdmin
      .from("entries")
      .select("data")
      .eq("cliente_id", clienteId)
      .eq("sheet", sheet)
      .order("created_at", { ascending: true });
    const rows = (data || []).map((e: any) =>
      Array.isArray(e.data?.row) ? e.data.row : e.data?.row || e.data,
    );
    return json({ ok: true, rows });
  }

  if (action === "getPainel") {
    const mes = String(params.mes || "").toUpperCase();

    // Renda (planejado de receitas)
    const { data: rendaRows } = await supabaseAdmin
      .from("entries")
      .select("data")
      .eq("cliente_id", clienteId)
      .eq("sheet", "Renda e Planejamento")
      .order("created_at", { ascending: false })
      .limit(1);
    const renda: any = rendaRows?.[0]?.data || {};
    const receitaPlan = Number(renda?.salario || 0) + Number(renda?.outras || 0);

    // Planejado (extra) — sheet "Planejamento Extraordinário"
    const { data: extra } = await supabaseAdmin
      .from("entries")
      .select("data")
      .eq("cliente_id", clienteId)
      .eq("sheet", "Planejamento Extraordinário");
    const plan = { obrigatorias: 0, naoobl: 0, invest: 0 };
    (extra || []).forEach((e: any) => {
      const row = e.data?.row || [];
      // [mes, cat, valor, ano]
      if (String(row[0] || "").toUpperCase() !== mes) return;
      const g = groupOfLabel(String(row[1] || ""));
      if (g && g in plan) (plan as any)[g] += Number(row[2] || 0);
    });

    // Realizado — sheet "Detalhamento DESPESAS"
    const { data: desp } = await supabaseAdmin
      .from("entries")
      .select("data")
      .eq("cliente_id", clienteId)
      .eq("sheet", "Detalhamento DESPESAS");
    const real = { obrigatorias: 0, naoobl: 0, invest: 0 };
    (desp || []).forEach((e: any) => {
      const row = e.data?.row || [];
      // [fp, bco, dt, desc, vp, cat, mes, ano]
      if (String(row[6] || "").toUpperCase() !== mes) return;
      const catFull = String(row[5] || "");
      const grpLabel = catFull.split("·")[0]?.trim() || catFull;
      const g = groupOfLabel(grpLabel);
      if (g && g in real) (real as any)[g] += Number(row[4] || 0);
    });

    return json({
      ok: true,
      receitas: { planejado: receitaPlan, realizado: receitaPlan },
      obrigatorias: { planejado: plan.obrigatorias, realizado: real.obrigatorias },
      naoobl: { planejado: plan.naoobl, realizado: real.naoobl },
      invest: { planejado: plan.invest, realizado: real.invest },
    });
  }

  return json({ error: "Ação desconhecida: " + action });
}

export const Route = createFileRoute("/api/sheets")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const params: Record<string, any> = {};
        url.searchParams.forEach((v, k) => (params[k] = v));
        const action = String(params.action || "");
        return handleAction(action, params);
      },
      POST: async ({ request }) => {
        const txt = await request.text();
        let body: any = {};
        try {
          body = txt ? JSON.parse(txt) : {};
        } catch {
          return json({ error: "JSON inválido." }, 400);
        }
        const action = String(body.action || "");
        return handleAction(action, body);
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),
    },
  },
});

// Suppress "unused" — CATS_EXTRA reserved for future use
void CATS_EXTRA;
