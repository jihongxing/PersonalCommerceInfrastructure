CREATE TABLE public.goods_offerings (
  id uuid PRIMARY KEY,
  seller_id text NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  state text NOT NULL CHECK (state IN ('draft', 'published', 'paused')),
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
--> statement-breakpoint
CREATE INDEX goods_offerings_seller_idx ON public.goods_offerings (seller_id, created_at, id);
--> statement-breakpoint
CREATE TABLE public.goods_orders (
  id uuid PRIMARY KEY,
  offering_id uuid NOT NULL REFERENCES public.goods_offerings (id),
  seller_id text NOT NULL,
  buyer_account_id text NOT NULL,
  idempotency_key text NOT NULL,
  state text NOT NULL CHECK (state IN ('pending', 'accepted', 'rejected')),
  snapshot jsonb NOT NULL,
  data jsonb NOT NULL,
  submitted_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (buyer_account_id, idempotency_key)
);
--> statement-breakpoint
CREATE INDEX goods_orders_seller_idx ON public.goods_orders (seller_id, submitted_at, id);
--> statement-breakpoint
CREATE INDEX goods_orders_buyer_idx ON public.goods_orders (buyer_account_id, submitted_at, id);
--> statement-breakpoint
CREATE TABLE public.goods_order_acceptances (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE REFERENCES public.goods_orders (id),
  seller_id text NOT NULL,
  data jsonb NOT NULL,
  occurred_at timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE public.goods_commitments (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE REFERENCES public.goods_orders (id),
  seller_id text NOT NULL,
  buyer_account_id text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE public.goods_deliveries (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE REFERENCES public.goods_orders (id),
  seller_id text NOT NULL,
  data jsonb NOT NULL,
  occurred_at timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE public.goods_buyer_receipts (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE REFERENCES public.goods_orders (id),
  buyer_account_id text NOT NULL,
  data jsonb NOT NULL,
  occurred_at timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE public.goods_cancellation_proposals (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE REFERENCES public.goods_orders (id),
  seller_id text NOT NULL,
  data jsonb NOT NULL,
  occurred_at timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE public.goods_audits (
  id uuid PRIMARY KEY,
  target_type text NOT NULL CHECK (target_type IN ('goods_offering', 'goods_order')),
  target_id uuid NOT NULL,
  action text NOT NULL,
  before_state jsonb NOT NULL,
  after_state jsonb NOT NULL,
  reason text NOT NULL,
  actor_id text NOT NULL,
  actor_account_id text,
  occurred_at timestamptz NOT NULL,
  correlation_id text NOT NULL
);
--> statement-breakpoint
CREATE INDEX goods_audits_target_idx ON public.goods_audits (target_type, target_id, occurred_at, id);
