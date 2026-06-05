import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/* ──────────────────────────────────────────────
   AUTH TOKEN (HMAC-signed, stateless)
─────────────────────────────────────────────── */
type TokenPayload = { uid: string; role: string; cid: string | null; exp: number };

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}
function getSecret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_URL || "dev-fallback-secret";
  return s;
}
function signToken(p: TokenPayload): string {
  const body = b64urlEncode(Buffer.from(JSON.stringify(p)));
  const sig = b64urlEncode(createHmac("sha256", getSecret()).update(body).digest());
  return `${body}.${sig}`;
}
function verifyToken(tok: string | null | undefined): TokenPayload | null {
  if (!tok || typeof tok !== "string" || !tok.includes(".")) return null;
  const [body, sig] = tok.split(".");
  if (!body || !sig) return null;
  const expected = b64urlEncode(createHmac("sha256", getSecret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(b64urlDecode(body).toString("utf8")) as TokenPayload;
    if (!p || typeof p.exp !== "number" || p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}
function bearerFrom(request: Request): string | null {
  const h = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/* Resolve effective clienteId honoring role isolation.
   - cliente role: ALWAYS uses token.cid. Body value ignored.
   - consultor role: may pass any clienteId in body.
*/
function effectiveClienteId(auth: TokenPayload, bodyClienteId: any): string | null {
  if (auth.role === "consultor") {
    return (bodyClienteId && String(bodyClienteId)) || auth.cid || null;
  }
  return auth.cid || null;
}

/* ──────────────────────────────────────────────
   ACTION HANDLER
─────────────────────────────────────────────── */
async function handleAction(action: string, params: Record<string, any>, request: Request) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  /* PUBLIC: login */
  if (action === "login") {
    const { email, senha } = params;
    const { data: rows } = await supabaseAdmin.rpc("verify_user_password", {
      p_email: String(email || ""),
      p_senha: String(senha || ""),
    });
    const u = Array.isArray(rows) ? rows[0] : rows;
    if (!u) return json({ error: "E-mail ou senha inválidos." });
    const cidVal = u.cliente_id || (u.role === "cliente" ? u.id : null);
    const token = signToken({
      uid: u.id,
      role: u.role,
      cid: cidVal,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    });
    return json({
      ok: true,
      token,
      nome: u.nome,
      email: u.email,
      role: u.role,
      clienteId: cidVal,
      perfil: u.role,
    });
  }

  /* ALL OTHER ACTIONS REQUIRE AUTH */
  const auth = verifyToken(bearerFrom(request));
  if (!auth) return json({ error: "Sessão expirada. Faça login novamente." }, 401);

  /* CONSULTOR-ONLY: client management */
  if (action === "getClientes") {
    if (auth.role !== "consultor") return json({ error: "Acesso negado." }, 403);
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
    if (auth.role !== "consultor") return json({ error: "Acesso negado." }, 403);
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
    const cid = "C" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6).toUpperCase();
    await supabaseAdmin.from("clientes").insert({
      cliente_id: cid,
      nome,
      email,
      telefone: d.telefone || null,
      data: d,
    });
    const { data: hashed } = await supabaseAdmin.rpc("hash_password", { senha });
    await supabaseAdmin.from("usuarios").insert({
      email,
      senha: String(hashed || ""),
      nome,
      role: "cliente",
      cliente_id: cid,
    });
    return json({ ok: true, clienteId: cid });
  }

  if (action === "deleteCliente") {
    if (auth.role !== "consultor") return json({ error: "Acesso negado." }, 403);
    const cid = params.clienteId;
    if (!cid) return json({ error: "clienteId obrigatório." });
    await supabaseAdmin.from("entries").delete().eq("cliente_id", cid);
    await supabaseAdmin.from("usuarios").delete().eq("cliente_id", cid);
    await supabaseAdmin.from("clientes").delete().eq("cliente_id", cid);
    await supabaseAdmin.from("plano_acao").delete().eq("cliente_id", cid);
    await supabaseAdmin.from("reserva_ideal").delete().eq("cliente_id", cid);
    await supabaseAdmin.from("despesas").delete().eq("cliente_id", cid);
    await supabaseAdmin.from("dividas").delete().eq("cliente_id", cid);
    await supabaseAdmin.from("extraordinario").delete().eq("cliente_id", cid);
    return json({ ok: true });
  }

  /* CLIENT-SCOPED — server enforces clienteId */
  const clienteId = effectiveClienteId(auth, params.clienteId);
  if (!clienteId) return json({ error: "Cliente não selecionado." });

  /* ── LEGACY entries-based actions (kept for compatibility) ── */
  if (action === "savePerfil") {
    await supabaseAdmin.from("entries").delete().eq("cliente_id", clienteId).eq("sheet", "Perfil");
    await supabaseAdmin.from("entries").insert({ cliente_id: clienteId, sheet: "Perfil", data: params.data || {} });
    return json({ ok: true });
  }

  if (action === "saveRenda") {
    await supabaseAdmin.from("entries").delete().eq("cliente_id", clienteId).eq("sheet", "Renda e Planejamento");
    await supabaseAdmin.from("entries").insert({ cliente_id: clienteId, sheet: "Renda e Planejamento", data: params.data || {} });
    return json({ ok: true });
  }

  if (action === "appendRows") {
    const sheet = String(params.sheet || "");
    const rows = Array.isArray(params.rows) ? params.rows : [];
    if (!sheet || !rows.length) return json({ error: "sheet/rows obrigatórios." });
    const records = rows.map((r: any) => ({ cliente_id: clienteId, sheet, data: { row: r } }));
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
    const rows = (data || []).map((e: any) => (Array.isArray(e.data?.row) ? e.data.row : e.data?.row || e.data));
    return json({ ok: true, rows });
  }

  if (action === "getPainel") {
    const mes = String(params.mes || "").toUpperCase();
    const { data: rendaRows } = await supabaseAdmin
      .from("entries").select("data")
      .eq("cliente_id", clienteId).eq("sheet", "Renda e Planejamento")
      .order("created_at", { ascending: false }).limit(1);
    const renda: any = rendaRows?.[0]?.data || {};
    const receitaPlan = Number(renda?.salario || 0) + Number(renda?.outras || 0);

    const groupOf = (label: string): "obrigatorias" | "naoobl" | "invest" | null => {
      const n = String(label || "").toLowerCase();
      if (n.includes("obrigat")) return "obrigatorias";
      if (n.includes("invest")) return "invest";
      if (n.includes("não") || n.includes("nao")) return "naoobl";
      return null;
    };

    const { data: extra } = await supabaseAdmin.from("entries").select("data")
      .eq("cliente_id", clienteId).eq("sheet", "Planejamento Extraordinário");
    const plan = { obrigatorias: 0, naoobl: 0, invest: 0 };
    (extra || []).forEach((e: any) => {
      const row = e.data?.row || [];
      if (String(row[0] || "").toUpperCase() !== mes) return;
      const g = groupOf(String(row[1] || ""));
      if (g) (plan as any)[g] += Number(row[2] || 0);
    });

    const { data: desp } = await supabaseAdmin.from("entries").select("data")
      .eq("cliente_id", clienteId).eq("sheet", "Detalhamento DESPESAS");
    const real = { obrigatorias: 0, naoobl: 0, invest: 0 };
    (desp || []).forEach((e: any) => {
      const row = e.data?.row || [];
      if (String(row[6] || "").toUpperCase() !== mes) return;
      const catFull = String(row[5] || "");
      const grpLabel = catFull.split("·")[0]?.trim() || catFull;
      const g = groupOf(grpLabel);
      if (g) (real as any)[g] += Number(row[4] || 0);
    });

    return json({
      ok: true,
      receitas: { planejado: receitaPlan, realizado: receitaPlan },
      obrigatorias: { planejado: plan.obrigatorias, realizado: real.obrigatorias },
      naoobl: { planejado: plan.naoobl, realizado: real.naoobl },
      invest: { planejado: plan.invest, realizado: real.invest },
    });
  }

  /* ── NEW: PLANO DE AÇÃO ── */
  if (action === "getPlanoAcao") {
    const { data } = await supabaseAdmin.from("plano_acao").select("*")
      .eq("cliente_id", clienteId).order("created_at", { ascending: false });
    return json({ ok: true, rows: data || [] });
  }
  if (action === "savePlanoAcao") {
    const rec = params.data || {};
    const payload = {
      cliente_id: clienteId,
      titulo: String(rec.titulo || ""),
      descricao: rec.descricao || null,
      prazo: rec.prazo || null,
      status: rec.status || "pendente",
      prioridade: rec.prioridade || "media",
      updated_at: new Date().toISOString(),
    };
    if (rec.id) {
      const { error } = await supabaseAdmin.from("plano_acao").update(payload).eq("id", rec.id).eq("cliente_id", clienteId);
      if (error) return json({ error: error.message });
    } else {
      const { error } = await supabaseAdmin.from("plano_acao").insert(payload);
      if (error) return json({ error: error.message });
    }
    return json({ ok: true });
  }
  if (action === "deletePlanoAcao") {
    const id = params.id;
    if (!id) return json({ error: "id obrigatório." });
    await supabaseAdmin.from("plano_acao").delete().eq("id", id).eq("cliente_id", clienteId);
    return json({ ok: true });
  }

  /* ── NEW: RESERVA IDEAL ── */
  if (action === "getReserva") {
    const { data } = await supabaseAdmin.from("reserva_ideal").select("*").eq("cliente_id", clienteId).maybeSingle();
    return json({ ok: true, reserva: data || null });
  }
  if (action === "saveReserva") {
    const r = params.data || {};
    const payload = {
      cliente_id: clienteId,
      valor_alvo: Number(r.valor_alvo || 0),
      meses_cobertura: Number(r.meses_cobertura || 6),
      valor_atual: Number(r.valor_atual || 0),
      observacoes: r.observacoes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from("reserva_ideal").upsert(payload, { onConflict: "cliente_id" });
    if (error) return json({ error: error.message });
    return json({ ok: true });
  }

  /* ── NEW: DESPESAS (tabela dedicada) ── */
  if (action === "getDespesas") {
    const { data } = await supabaseAdmin.from("despesas").select("*")
      .eq("cliente_id", clienteId).order("data", { ascending: false }).limit(1000);
    return json({ ok: true, rows: data || [] });
  }
  if (action === "addDespesas") {
    const rows = Array.isArray(params.rows) ? params.rows : [];
    if (!rows.length) return json({ error: "Nenhuma despesa para inserir." });
    const records = rows.map((r: any) => ({
      cliente_id: clienteId,
      data: r.data,
      descricao: String(r.descricao || "").slice(0, 500),
      categoria: r.categoria || null,
      grupo: r.grupo || null,
      valor: Math.abs(Number(r.valor || 0)),
      forma_pagamento: r.forma_pagamento || null,
      banco: r.banco || null,
      mes: r.mes || null,
      ano: r.ano || null,
      origem: r.origem || "manual",
    }));
    const { error, count } = await supabaseAdmin
      .from("despesas")
      .upsert(records, { onConflict: "cliente_id,data,valor,descricao", ignoreDuplicates: true, count: "exact" });
    if (error) return json({ error: error.message });
    return json({ ok: true, count: count ?? records.length });
  }
  if (action === "deleteDespesa") {
    const id = params.id;
    if (!id) return json({ error: "id obrigatório." });
    await supabaseAdmin.from("despesas").delete().eq("id", id).eq("cliente_id", clienteId);
    return json({ ok: true });
  }

  /* ── NEW: DÍVIDAS ── */
  if (action === "getDividas") {
    const { data } = await supabaseAdmin.from("dividas").select("*")
      .eq("cliente_id", clienteId).order("created_at", { ascending: false });
    return json({ ok: true, rows: data || [] });
  }
  if (action === "saveDivida") {
    const r = params.data || {};
    const payload = {
      cliente_id: clienteId,
      credor: String(r.credor || ""),
      tipo: r.tipo || null,
      saldo_devedor: Number(r.saldo_devedor || 0),
      taxa_juros: r.taxa_juros != null ? Number(r.taxa_juros) : null,
      parcelas_restantes: r.parcelas_restantes != null ? Number(r.parcelas_restantes) : null,
      valor_parcela: r.valor_parcela != null ? Number(r.valor_parcela) : null,
      status: r.status || "ativa",
      updated_at: new Date().toISOString(),
    };
    if (r.id) {
      await supabaseAdmin.from("dividas").update(payload).eq("id", r.id).eq("cliente_id", clienteId);
    } else {
      await supabaseAdmin.from("dividas").insert(payload);
    }
    return json({ ok: true });
  }
  if (action === "deleteDivida") {
    const id = params.id;
    if (!id) return json({ error: "id obrigatório." });
    await supabaseAdmin.from("dividas").delete().eq("id", id).eq("cliente_id", clienteId);
    return json({ ok: true });
  }

  /* ── NEW: EXTRAORDINÁRIO ── */
  if (action === "getExtraordinario") {
    const { data } = await supabaseAdmin.from("extraordinario").select("*")
      .eq("cliente_id", clienteId).order("ano", { ascending: true }).order("mes", { ascending: true });
    return json({ ok: true, rows: data || [] });
  }
  if (action === "saveExtraordinario") {
    const rows = Array.isArray(params.rows) ? params.rows : [];
    await supabaseAdmin.from("extraordinario").delete().eq("cliente_id", clienteId);
    if (rows.length) {
      const recs = rows.map((r: any) => ({
        cliente_id: clienteId,
        mes: String(r.mes || "").toUpperCase(),
        ano: String(r.ano || ""),
        categoria: r.categoria || null,
        grupo: r.grupo || null,
        valor_planejado: Number(r.valor_planejado || 0),
        descricao: r.descricao || null,
      }));
      await supabaseAdmin.from("extraordinario").insert(recs);
    }
    return json({ ok: true });
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
        return handleAction(String(params.action || ""), params, request);
      },
      POST: async ({ request }) => {
        const txt = await request.text();
        let body: any = {};
        try { body = txt ? JSON.parse(txt) : {}; }
        catch { return json({ error: "JSON inválido." }, 400); }
        return handleAction(String(body.action || ""), body, request);
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }),
    },
  },
});
