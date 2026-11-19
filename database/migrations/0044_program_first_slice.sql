CREATE TABLE public.program_offerings (
  id uuid PRIMARY KEY,
  provider_id text NOT NULL,
  data jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX program_offerings_provider_idx ON public.program_offerings (provider_id, id);
--> statement-breakpoint
CREATE TABLE public.program_runs (
  id uuid PRIMARY KEY,
  offering_id uuid NOT NULL REFERENCES public.program_offerings (id),
  provider_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  created_at timestamptz NOT NULL,
  data jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX program_runs_provider_idx ON public.program_runs (provider_id, created_at, id);
--> statement-breakpoint
CREATE INDEX program_runs_public_idx ON public.program_runs (status, starts_at, id);
--> statement-breakpoint
CREATE TABLE public.program_sessions (
  id uuid PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES public.program_runs (id),
  sequence integer NOT NULL CHECK (sequence > 0),
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  data jsonb NOT NULL,
  UNIQUE (run_id, sequence)
);
--> statement-breakpoint
CREATE INDEX program_sessions_run_idx ON public.program_sessions (run_id, sequence, id);
--> statement-breakpoint
CREATE TABLE public.program_applications (
  id uuid PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES public.program_runs (id),
  account_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (run_id, account_id)
);
--> statement-breakpoint
CREATE INDEX program_applications_account_idx ON public.program_applications (account_id, created_at, id);
--> statement-breakpoint
CREATE TABLE public.program_enrollments (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL UNIQUE REFERENCES public.program_applications (id),
  run_id uuid NOT NULL REFERENCES public.program_runs (id),
  account_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('confirmed', 'withdrawn_before_start', 'withdrawn_after_start')),
  data jsonb NOT NULL,
  confirmed_at timestamptz NOT NULL
);
--> statement-breakpoint
CREATE INDEX program_enrollments_run_idx ON public.program_enrollments (run_id, confirmed_at, id);
CREATE INDEX program_enrollments_account_idx ON public.program_enrollments (account_id, confirmed_at, id);
--> statement-breakpoint
CREATE TABLE public.program_attendance (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.program_sessions (id),
  enrollment_id uuid NOT NULL REFERENCES public.program_enrollments (id),
  status text NOT NULL CHECK (status IN ('attended', 'absent')),
  data jsonb NOT NULL,
  recorded_at timestamptz NOT NULL,
  UNIQUE (session_id, enrollment_id)
);
--> statement-breakpoint
CREATE TABLE public.program_completions (
  id uuid PRIMARY KEY,
  enrollment_id uuid NOT NULL UNIQUE REFERENCES public.program_enrollments (id),
  completed boolean NOT NULL,
  data jsonb NOT NULL,
  recorded_at timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE public.program_audits (
  id uuid PRIMARY KEY,
  target_type text NOT NULL,
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
CREATE INDEX program_audits_target_idx ON public.program_audits (target_type, target_id, occurred_at, id);
