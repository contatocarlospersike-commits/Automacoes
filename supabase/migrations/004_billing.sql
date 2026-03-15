-- =========================================================
-- BREKVA Billing System
-- Migration 004: Plans, Subscriptions, Usage, Invoices
-- =========================================================

-- ---------------------------------------------------------
-- 1. Plans table (reference/config)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price_cents INTEGER NOT NULL,
  message_unit_price_cents INTEGER NOT NULL,
  max_contacts INTEGER,
  max_campaigns_per_month INTEGER,
  max_messages_per_month INTEGER,
  features JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active plans"
  ON public.plans
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- ---------------------------------------------------------
-- 2. Subscriptions table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  asaas_customer_id TEXT,
  asaas_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'active', 'overdue', 'cancelled', 'trial', 'suspended')
  ),
  billing_type TEXT NOT NULL DEFAULT 'PIX' CHECK (
    billing_type IN ('PIX', 'BOLETO', 'CREDIT_CARD')
  ),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  gifted_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_sub_id ON public.subscriptions(asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ---------------------------------------------------------
-- 3. Usage records table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  unit_price_cents INTEGER NOT NULL,
  total_cost_cents INTEGER GENERATED ALWAYS AS (message_count * unit_price_cents) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, period_start)
);

ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view own usage records"
  ON public.usage_records
  FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_usage_records_org_period ON public.usage_records(org_id, period_start);

-- ---------------------------------------------------------
-- 4. Invoices table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  usage_record_id UUID REFERENCES public.usage_records(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  subscription_amount_cents INTEGER NOT NULL DEFAULT 0,
  usage_amount_cents INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled', 'refunded')
  ),
  asaas_payment_id TEXT,
  asaas_invoice_url TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view own invoices"
  ON public.invoices
  FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_asaas_payment_id ON public.invoices(asaas_payment_id);

-- ---------------------------------------------------------
-- 5. Payment events table (webhook log)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  asaas_payment_id TEXT,
  asaas_subscription_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asaas_event_id)
);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payment_events_asaas_id ON public.payment_events(asaas_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON public.payment_events(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_unprocessed ON public.payment_events(processed)
  WHERE processed = false;

-- ---------------------------------------------------------
-- 6. Add subscription_id to organizations
-- ---------------------------------------------------------
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id);

-- ---------------------------------------------------------
-- 7. Atomic usage increment function
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_org_id UUID,
  p_count INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_unit_price INTEGER;
BEGIN
  v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
  v_period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  SELECT p.message_unit_price_cents INTO v_unit_price
  FROM public.subscriptions s
  JOIN public.plans p ON s.plan_id = p.id
  WHERE s.org_id = p_org_id AND s.status IN ('active', 'trial')
  LIMIT 1;

  IF v_unit_price IS NULL THEN
    v_unit_price := 46;
  END IF;

  INSERT INTO public.usage_records (org_id, period_start, period_end, message_count, unit_price_cents)
  VALUES (p_org_id, v_period_start, v_period_end, p_count, v_unit_price)
  ON CONFLICT (org_id, period_start)
  DO UPDATE SET
    message_count = public.usage_records.message_count + p_count,
    updated_at = NOW();
END;
$$;

-- ---------------------------------------------------------
-- 8. Seed plans data
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
