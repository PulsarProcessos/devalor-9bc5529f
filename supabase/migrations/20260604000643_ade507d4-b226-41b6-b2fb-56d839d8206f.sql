
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'consultor',
  cliente_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.clientes (
  cliente_id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  observacoes TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet TEXT NOT NULL,
  cliente_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX entries_sheet_cliente_idx ON public.entries(sheet, cliente_id);

GRANT ALL ON public.usuarios TO service_role;
GRANT ALL ON public.clientes TO service_role;
GRANT ALL ON public.entries TO service_role;

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Sem políticas para anon/authenticated: tudo passa pelo servidor com service_role.

-- Consultor inicial
INSERT INTO public.usuarios (email, senha, nome, role)
VALUES ('admin@devalor.com', 'admin123', 'Consultor', 'consultor');
