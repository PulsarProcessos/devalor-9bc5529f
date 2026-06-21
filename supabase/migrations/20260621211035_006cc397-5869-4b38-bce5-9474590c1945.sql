
ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS cartao text,
  ADD COLUMN IF NOT EXISTS mes_pagamento text,
  ADD COLUMN IF NOT EXISTS parcela_n integer,
  ADD COLUMN IF NOT EXISTS parcela_total integer,
  ADD COLUMN IF NOT EXISTS parcela_grupo_id uuid,
  ADD COLUMN IF NOT EXISTS pago boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS despesas_parcela_grupo_idx
  ON public.despesas (parcela_grupo_id);
