-- =========================================================
-- BREKVA Migration 008: Email campaign stats + plans seed
-- =========================================================

-- ---------------------------------------------------------
-- 1. Atomic increment for email campaign stats
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_email_campaign_stat(
  p_campaign_id UUID,
  p_field TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_field = 'total_opened' THEN
    UPDATE public.email_campaigns
    SET total_opened = total_opened + 1, updated_at = NOW()
    WHERE id = p_campaign_id;
  ELSIF p_field = 'total_clicked' THEN
    UPDATE public.email_campaigns
    SET total_clicked = total_clicked + 1, updated_at = NOW()
    WHERE id = p_campaign_id;
  ELSIF p_field = 'total_bounced' THEN
    UPDATE public.email_campaigns
    SET total_bounced = total_bounced + 1, updated_at = NOW()
    WHERE id = p_campaign_id;
  ELSIF p_field = 'total_failed' THEN
    UPDATE public.email_campaigns
    SET total_failed = total_failed + 1, updated_at = NOW()
    WHERE id = p_campaign_id;
  END IF;
END;
$$;

-- ---------------------------------------------------------
-- 2. Add status columns to email_queue if missing
-- ---------------------------------------------------------
DO $$
BEGIN
  -- Add 'delivered' and 'bounced' and 'complained' to status check if not already there
  -- email_queue status may not include all needed values
  ALTER TABLE public.email_queue
    DROP CONSTRAINT IF EXISTS email_queue_status_check;

  ALTER TABLE public.email_queue
    ADD CONSTRAINT email_queue_status_check
    CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'complained'));
EXCEPTION
  WHEN others THEN NULL;
END;
$$;

-- ---------------------------------------------------------
-- 3. Ensure plans are seeded (idempotent)
-- ---------------------------------------------------------
INSERT INTO public.plans (slug, name, description, monthly_price_cents, message_unit_price_cents, max_contacts, max_campaigns_per_month, max_messages_per_month, features, sort_order)
VALUES
  ('start', 'Start', 'Plano inicial para comecar suas operacoes',
   9700, 46, 5000, 15, NULL,
   '["Ate 5.000 contatos", "15 campanhas/mes", "Relatorios completos", "Suporte por email", "Agendamento basico"]'::JSONB,
   1),

  ('pro', 'Pro', 'Para operacoes em crescimento',
   19700, 46, 25000, 100, NULL,
   '["Ate 25.000 contatos", "100 campanhas/mes", "Relatorios completos", "Suporte prioritario", "API de integracao", "Agendamento avancado"]'::JSONB,
   2),

  ('pro_max', 'Pro Max', 'Operacao profissional sem limites',
   39700, 46, NULL, NULL, NULL,
   '["Contatos ilimitados", "Campanhas ilimitadas", "Relatorios completos", "Suporte dedicado", "API de integracao", "Agendamento avancado", "Multi-usuario", "Automacoes de fluxo (em breve)"]'::JSONB,
   3)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------
-- 4. Index for email_queue lookups by resend_email_id
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_email_queue_resend_id
  ON public.email_queue(resend_email_id)
  WHERE resend_email_id IS NOT NULL;
