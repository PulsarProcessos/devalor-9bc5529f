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

  /* ── PERFIL DO CLIENTE → tabela perfil_cliente ── */
  if (action === "savePerfil") {
    const d = params.data || {};
    const payload = {
      cliente_id: clienteId,
      nome: d.nome || null,
      email: d.email || null,
      telefone: d.telefone || null,
      clt: d.clt === "sim" ? true : d.clt === "nao" ? false : null,
      filhos: d.filhos === "sim" ? 1 : d.filhos === "nao" ? 0 : (Number.isFinite(+d.filhos) ? Number(d.filhos) : null),
      rede: d.rede || null,
      gastos_mensais: Number(d.gastosMensais || 0),
      reserva_meses: Number(d.reservaMeses || 0),
      reserva_valor: Number(d.reservaValor || 0),
      ano: String(d.ano || new Date().getFullYear()),
      data: d,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from("perfil_cliente").upsert(payload, { onConflict: "cliente_id" });
    if (error) return json({ error: error.message });
    return json({ ok: true });
  }
  if (action === "getPerfil") {
    const { data } = await supabaseAdmin.from("perfil_cliente").select("*").eq("cliente_id", clienteId).maybeSingle();
    return json({ ok: true, perfil: data || null });
  }

  /* ── RENDA E PLANEJAMENTO → tabela renda_planejamento ── */
  if (action === "saveRenda") {
    const d = params.data || {};
    const ano = String(d.ano || new Date().getFullYear());
    const payload = {
      cliente_id: clienteId,
      ano,
      salario: Number(d.salario || 0),
      outras: Number(d.outras || 0),
      data: d,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseAdmin.from("renda_planejamento").upsert(payload, { onConflict: "cliente_id,ano" });
    if (error) return json({ error: error.message });
    return json({ ok: true });
  }
  if (action === "getRenda") {
    const ano = String(params.ano || new Date().getFullYear());
    const { data } = await supabaseAdmin
      .from("renda_planejamento").select("*")
      .eq("cliente_id", clienteId).eq("ano", ano).maybeSingle();
    return json({ ok: true, renda: data || null });
  }

  /* ── appendRows / getRows: roteado para a tabela correta por sheet name ── */
  const SHEET_MAP: Record<string, string> = {
    "Vida Rica": "sonhos",
    "Quitação de Dívidas": "dividas",
    "Detalhamento DESPESAS": "despesas",
    "Planejamento Extraordinário": "extraordinario",
    "Plano de Ação": "plano_acao",
  };

  if (action === "appendRows") {
    const sheet = String(params.sheet || "");
    const rows = Array.isArray(params.rows) ? params.rows : [];
    if (!sheet || !rows.length) return json({ error: "sheet/rows obrigatórios." });
    const target = SHEET_MAP[sheet];
    if (!target) return json({ error: "Sheet não suportada: " + sheet });
    const ano = String(new Date().getFullYear());

    if (target === "sonhos") {
      // row: [quem, obj, motivo, valor, prazo, tipo, ano]
      const recs = rows.map((r: any) => ({
        cliente_id: clienteId,
        descricao: `${r[0] || ""} — ${r[1] || ""}${r[2] ? ": " + r[2] : ""}`.trim(),
        prazo: r[4] || null,
        valor: Number(r[3] || 0),
        prioridade: r[5] || null,
        ano: String(r[6] || ano),
      }));
      const { error } = await supabaseAdmin.from("sonhos").insert(recs);
      if (error) return json({ error: error.message });
      return json({ ok: true, count: recs.length });
    }

    if (target === "dividas") {
      // row: [banco, desc, vs, pt, vp, sd, juros, up, tp, ano]
      const recs = rows.map((r: any) => ({
        cliente_id: clienteId,
        credor: String(r[0] || ""),
        tipo: String(r[1] || "") || null,
        saldo_devedor: Number(r[5] || 0),
        taxa_juros: r[6] != null ? Number(r[6]) : null,
        parcelas_restantes: r[3] != null ? Number(r[3]) : null,
        valor_parcela: r[4] != null ? Number(r[4]) : null,
        status: "ativa",
      }));
      const { error } = await supabaseAdmin.from("dividas").insert(recs);
      if (error) return json({ error: error.message });
      return json({ ok: true, count: recs.length });
    }

    if (target === "despesas") {
      // Suporta duas formas:
      //  manual:    [fp, bco, dt, desc, vp, cat, mes, ano]
      //  importação:['Importação', dt, desc, valor, cat, mes, ano]
      const recs = rows.map((r: any) => {
        const isImport = r.length === 7 && String(r[0] || "").toLowerCase().startsWith("import");
        const dt = isImport ? r[1] : r[2];
        const desc = isImport ? r[2] : r[3];
        const valor = Number(isImport ? r[3] : r[4]);
        const catFull = String(isImport ? r[4] : r[5] || "");
        const mes = String(isImport ? r[5] : r[6] || "");
        const a = String(isImport ? r[6] : r[7] || ano);
        const fp = isImport ? "Importação" : r[0];
        const bco = isImport ? null : r[1];
        const [grupo, categoria] = catFull.split("·").map((s) => s.trim());
        return {
          cliente_id: clienteId,
          data: normalizeDate(dt),
          descricao: String(desc || "").slice(0, 500),
          categoria: categoria || catFull || null,
          grupo: grupo || null,
          valor: Math.abs(valor || 0),
          forma_pagamento: fp || null,
          banco: bco || null,
          mes: mes || null,
          ano: a,
          origem: isImport ? "import" : "manual",
        };
      }).filter((r) => r.descricao && r.valor > 0 && r.data);
      if (!recs.length) return json({ error: "Nenhuma linha válida." });
      const { error, count } = await supabaseAdmin
        .from("despesas")
        .upsert(recs, { onConflict: "cliente_id,data,valor,descricao", ignoreDuplicates: true, count: "exact" });
      if (error) return json({ error: error.message });
      return json({ ok: true, count: count ?? recs.length });
    }

    if (target === "extraordinario") {
      // Aceita: [mes, cat, valor, ano]  OU  [mes, cat, desc, valor, ano]
      const recs = rows.map((r: any) => {
        const hasDesc = r.length >= 5;
        return {
          cliente_id: clienteId,
          mes: String(r[0] || "").toUpperCase(),
          categoria: r[1] || null,
          grupo: r[1] || null,
          descricao: hasDesc ? (r[2] || null) : null,
          valor_planejado: Number(hasDesc ? r[3] : r[2] || 0),
          ano: String(hasDesc ? r[4] : r[3] || ano),
        };
      });
      const { error } = await supabaseAdmin.from("extraordinario").insert(recs);
      if (error) return json({ error: error.message });
      return json({ ok: true, count: recs.length });
    }

    if (target === "plano_acao") {
      // row: [desc, obs, status, ano]
      const recs = rows.map((r: any) => ({
        cliente_id: clienteId,
        titulo: String(r[0] || "").slice(0, 300) || "(sem título)",
        descricao: r[1] || null,
        status: r[2] === "Concluído" ? "concluida" : "pendente",
        prioridade: "media",
      }));
      const { error } = await supabaseAdmin.from("plano_acao").insert(recs);
      if (error) return json({ error: error.message });
      return json({ ok: true, count: recs.length });
    }

    return json({ error: "Destino não mapeado." });
  }

  if (action === "getRows") {
    const sheet = String(params.sheet || "");
    if (sheet === "Vida Rica") {
      const { data } = await supabaseAdmin.from("sonhos").select("*")
        .eq("cliente_id", clienteId).order("created_at", { ascending: true });
      // formato esperado pelo frontend: row[0..5] = quem,obj,motivo,valor,prazo,tipo
      const rows = (data || []).map((s: any) => {
        const parts = String(s.descricao || "").split(" — ");
        const quem = parts[0] || "";
        const rest = parts.slice(1).join(" — ");
        const [obj, motivo] = rest.split(": ");
        return [quem, obj || rest, motivo || "", s.valor, s.prazo, s.prioridade];
      });
      return json({ ok: true, rows });
    }
    return json({ ok: true, rows: [] });
  }

  if (action === "getPainel") {
    const mes = String(params.mes || "").toUpperCase();
    const ano = String(params.ano || new Date().getFullYear());

    const { data: renda } = await supabaseAdmin
      .from("renda_planejamento").select("salario,outras")
      .eq("cliente_id", clienteId).eq("ano", ano).maybeSingle();
    const receitaPlan = Number(renda?.salario || 0) + Number(renda?.outras || 0);

    const groupOf = (label: string): "obrigatorias" | "naoobl" | "invest" | null => {
      const n = String(label || "").toLowerCase();
      if (n.includes("obrigat")) return "obrigatorias";
      if (n.includes("invest")) return "invest";
      if (n.includes("não") || n.includes("nao")) return "naoobl";
      return null;
    };

    const { data: extra } = await supabaseAdmin.from("extraordinario").select("mes,grupo,categoria,valor_planejado")
      .eq("cliente_id", clienteId).eq("ano", ano);
    const plan = { obrigatorias: 0, naoobl: 0, invest: 0 };
    (extra || []).forEach((e: any) => {
      if (String(e.mes || "").toUpperCase() !== mes) return;
      const g = groupOf(String(e.grupo || e.categoria || ""));
      if (g) (plan as any)[g] += Number(e.valor_planejado || 0);
    });

    const { data: desp } = await supabaseAdmin.from("despesas")
      .select("mes,grupo,categoria,valor").eq("cliente_id", clienteId);
    const real = { obrigatorias: 0, naoobl: 0, invest: 0 };
    (desp || []).forEach((d: any) => {
      if (String(d.mes || "").toUpperCase() !== mes) return;
      const g = groupOf(String(d.grupo || d.categoria || ""));
      if (g) (real as any)[g] += Number(d.valor || 0);
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
