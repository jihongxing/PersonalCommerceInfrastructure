CREATE TABLE public.membership_offerings (
  id uuid PRIMARY KEY,
  provider_id text NOT NULL,
  data jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX membership_offerings_provider_idx ON public.membership_offerings (provider_id, id);
--> statement-breakpoint
CREATE TABLE public.membership_applications (
  id uuid PRIMARY KEY,
  offering_id uuid NOT NULL REFERENCES public.membership_offerings (id),
  account_id text NOT NULL,
  data jsonb NOT NULL,
  UNIQUE (offering_id, account_id)
);
--> statement-breakpoint
CREATE INDEX membership_applications_account_idx ON public.membership_applications (account_id, id);
--> statement-breakpoint
CREATE TABLE public.commercial_memberships (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL UNIQUE REFERENCES public.membership_applications (id),
  data jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE public.membership_facts (
  id uuid PRIMARY KEY,
  membership_id uuid NOT NULL REFERENCES public.commercial_memberships (id),
  kind text NOT NULL CHECK (kind IN ('verification', 'admission', 'admission_correction')),
  reference_id uuid REFERENCES public.membership_facts (id),
  occurred_at timestamptz NOT NULL,
  data jsonb NOT NULL,
  CHECK ((kind = 'verification') = (reference_id IS NULL)),
  UNIQUE (kind, reference_id)
);
--> statement-breakpoint
CREATE INDEX membership_facts_member_idx ON public.membership_facts (membership_id, occurred_at, id);
