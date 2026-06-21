ALTER TABLE public.dividas
  ADD COLUMN IF NOT EXISTS valor_original numeric,
  ADD COLUMN IF NOT EXISTS total_pago numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parcelas_totais integer,
  ADD COLUMN IF NOT EXISTS parcelas_pagas integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_parcela numeric;