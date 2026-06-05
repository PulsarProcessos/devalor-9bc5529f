
CREATE TABLE IF NOT EXISTS public.perfil_cliente (
  cliente_id text PRIMARY KEY,
  nome text,
  email text,
  telefone text,
  clt boolean,
  filhos integer,
  rede text,
  gastos_mensais numeric DEFAULT 0,
  reserva_meses numeric DEFAULT 6,
  reserva_valor numeric DEFAULT 0,
  ano text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.perfil_cliente TO service_role;
ALTER TABLE public.perfil_cliente ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.perfil_cliente AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.perfil_cliente AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.renda_planejamento (
  cliente_id text NOT NULL,
  ano text NOT NULL,
  salario numeric NOT NULL DEFAULT 0,
  outras numeric NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cliente_id, ano)
);
GRANT ALL ON public.renda_planejamento TO service_role;
ALTER TABLE public.renda_planejamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.renda_planejamento AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.renda_planejamento AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.sonhos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id text NOT NULL,
  descricao text NOT NULL,
  prazo text,
  valor numeric DEFAULT 0,
  prioridade text,
  ano text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sonhos_cliente ON public.sonhos(cliente_id);
GRANT ALL ON public.sonhos TO service_role;
ALTER TABLE public.sonhos ENABLE ROW LEVEL SECURITY;
CREATE POLICY deny_anon_all ON public.sonhos AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.sonhos AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);
