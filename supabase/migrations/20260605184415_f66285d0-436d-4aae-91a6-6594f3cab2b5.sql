
-- Plano de Ação
CREATE TABLE public.plano_acao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  prazo date,
  status text NOT NULL DEFAULT 'pendente',
  prioridade text NOT NULL DEFAULT 'media',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.plano_acao TO service_role;
ALTER TABLE public.plano_acao ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.plano_acao AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.plano_acao AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX plano_acao_cliente_idx ON public.plano_acao(cliente_id);

-- Reserva Ideal (1 por cliente)
CREATE TABLE public.reserva_ideal (
  cliente_id text PRIMARY KEY,
  valor_alvo numeric NOT NULL DEFAULT 0,
  meses_cobertura numeric NOT NULL DEFAULT 6,
  valor_atual numeric NOT NULL DEFAULT 0,
  observacoes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.reserva_ideal TO service_role;
ALTER TABLE public.reserva_ideal ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.reserva_ideal AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.reserva_ideal AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- Despesas
CREATE TABLE public.despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id text NOT NULL,
  data date NOT NULL,
  descricao text NOT NULL,
  categoria text,
  grupo text,
  valor numeric NOT NULL,
  forma_pagamento text,
  banco text,
  mes text,
  ano text,
  origem text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.despesas TO service_role;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.despesas AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.despesas AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX despesas_cliente_idx ON public.despesas(cliente_id);
CREATE UNIQUE INDEX despesas_dedup_idx ON public.despesas(cliente_id, data, valor, descricao);

-- Dívidas
CREATE TABLE public.dividas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id text NOT NULL,
  credor text NOT NULL,
  tipo text,
  saldo_devedor numeric NOT NULL DEFAULT 0,
  taxa_juros numeric,
  parcelas_restantes int,
  valor_parcela numeric,
  status text NOT NULL DEFAULT 'ativa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.dividas TO service_role;
ALTER TABLE public.dividas ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.dividas AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.dividas AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX dividas_cliente_idx ON public.dividas(cliente_id);

-- Planejamento Extraordinário
CREATE TABLE public.extraordinario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id text NOT NULL,
  mes text NOT NULL,
  ano text NOT NULL,
  categoria text,
  grupo text,
  valor_planejado numeric NOT NULL DEFAULT 0,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.extraordinario TO service_role;
ALTER TABLE public.extraordinario ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.extraordinario AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.extraordinario AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX extraordinario_cliente_idx ON public.extraordinario(cliente_id);
