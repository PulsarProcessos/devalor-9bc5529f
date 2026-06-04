
-- pgcrypto for bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Hash existing plaintext passwords (only those that don't already look like bcrypt)
UPDATE public.usuarios
SET senha = crypt(senha, gen_salt('bf', 10))
WHERE senha IS NOT NULL AND senha NOT LIKE '$2%';

-- Helper: hash a password
CREATE OR REPLACE FUNCTION public.hash_password(senha text)
RETURNS text
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT crypt(senha, gen_salt('bf', 10));
$$;

-- Helper: verify credentials, returns matching user row (or none)
CREATE OR REPLACE FUNCTION public.verify_user_password(p_email text, p_senha text)
RETURNS TABLE (
  id uuid,
  email text,
  nome text,
  role text,
  cliente_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT u.id, u.email, u.nome, u.role, u.cliente_id
  FROM public.usuarios u
  WHERE lower(u.email) = lower(p_email)
    AND u.senha = crypt(p_senha, u.senha)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.hash_password(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_user_password(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hash_password(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_user_password(text, text) TO service_role;

-- Explicit deny-all policies for anon/authenticated. Service role bypasses RLS.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['usuarios','clientes','entries']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "deny_anon_all" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "deny_authenticated_all" ON public.%I', t);
    EXECUTE format('CREATE POLICY "deny_anon_all" ON public.%I AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false)', t);
    EXECUTE format('CREATE POLICY "deny_authenticated_all" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false)', t);
  END LOOP;
END $$;
