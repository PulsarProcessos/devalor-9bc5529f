CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id text NOT NULL,
  grupo text NOT NULL,
  nome text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.categorias AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.categorias AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX idx_categorias_cliente ON public.categorias (cliente_id);

CREATE TABLE public.bancos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id text NOT NULL,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, nome)
);
GRANT ALL ON public.bancos TO service_role;
ALTER TABLE public.bancos ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.bancos AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.bancos AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX idx_bancos_cliente ON public.bancos (cliente_id);

CREATE TABLE public.cartoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id text NOT NULL,
  nome text NOT NULL,
  banco text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, nome)
);
GRANT ALL ON public.cartoes TO service_role;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.cartoes AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.cartoes AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX idx_cartoes_cliente ON public.cartoes (cliente_id);

CREATE TABLE public.vencimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id text NOT NULL,
  descricao text NOT NULL,
  dia integer,
  valor numeric NOT NULL DEFAULT 0,
  categoria text,
  grupo text,
  banco text,
  forma_pagamento text,
  status text NOT NULL DEFAULT 'ativo',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.vencimentos TO service_role;
ALTER TABLE public.vencimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.vencimentos AS RESTRICTIVE TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.vencimentos AS RESTRICTIVE TO authenticated USING (false) WITH CHECK (false);
CREATE INDEX idx_vencimentos_cliente ON public.vencimentos (cliente_id);