-- DEV-064: migrate the single homepage projection to versioned scheduled homepages.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
CREATE TABLE public_commerce_homepage_versions (
  homepage_id varchar(128) PRIMARY KEY,
  identity_id varchar(128) NOT NULL REFERENCES identities(identity_id) ON DELETE RESTRICT,
  commerce_profile_id varchar(128),
  state varchar(32) NOT NULL DEFAULT 'UNPUBLISHED',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_commerce_homepage_versions_identity_homepage_unique UNIQUE (identity_id, homepage_id),
  CONSTRAINT public_commerce_homepage_versions_state_check
    CHECK (state IN ('UNPUBLISHED', 'PUBLISHED', 'PAUSED', 'ARCHIVED')),
  CONSTRAINT public_commerce_homepage_versions_published_profile_check
    CHECK (state = 'UNPUBLISHED' OR commerce_profile_id IS NOT NULL),
  CONSTRAINT public_commerce_homepage_versions_default_state_check
    CHECK (NOT is_default OR state = 'PUBLISHED'),
  CONSTRAINT public_commerce_homepage_versions_owned_profile_fk
    FOREIGN KEY (identity_id, commerce_profile_id)
    REFERENCES commerce_profiles (owning_identity_id, commerce_profile_id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE UNIQUE INDEX public_commerce_homepage_versions_default_unique
  ON public_commerce_homepage_versions (identity_id) WHERE is_default;
--> statement-breakpoint
CREATE INDEX public_commerce_homepage_versions_identity_idx
  ON public_commerce_homepage_versions (identity_id);
--> statement-breakpoint
CREATE TABLE public_commerce_homepage_windows (
  window_id varchar(128) PRIMARY KEY,
  identity_id varchar(128) NOT NULL,
  homepage_id varchar(128) NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  time_zone varchar(64) NOT NULL,
  state varchar(32) NOT NULL DEFAULT 'ENABLED',
  active_range tstzrange GENERATED ALWAYS AS (tstzrange(starts_at, ends_at, '[)')) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_commerce_homepage_windows_version_fk
    FOREIGN KEY (identity_id, homepage_id)
    REFERENCES public_commerce_homepage_versions (identity_id, homepage_id) ON DELETE CASCADE,
  CONSTRAINT public_commerce_homepage_windows_state_check
    CHECK (state IN ('ENABLED', 'DISABLED')),
  CONSTRAINT public_commerce_homepage_windows_range_check
    CHECK (starts_at < ends_at),
  CONSTRAINT public_commerce_homepage_windows_timezone_check
    CHECK (time_zone <> '')
);
--> statement-breakpoint
CREATE INDEX public_commerce_homepage_windows_identity_idx
  ON public_commerce_homepage_windows (identity_id);
--> statement-breakpoint
ALTER TABLE public_commerce_homepage_windows
  ADD CONSTRAINT public_commerce_homepage_windows_no_overlap
  EXCLUDE USING gist (identity_id WITH =, active_range WITH &&)
  WHERE (state = 'ENABLED');
--> statement-breakpoint
CREATE TABLE public_commerce_homepage_version_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id varchar(128) NOT NULL REFERENCES identities(identity_id) ON DELETE RESTRICT,
  homepage_id varchar(128),
  window_id varchar(128),
  actor_account_id varchar(256) NOT NULL CHECK (actor_account_id <> ''),
  action varchar(64) NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE FUNCTION audit_public_commerce_homepage_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  actor text := current_setting('pci.homepage_actor', true);
BEGIN
  IF actor IS NULL OR actor = '' THEN
    RAISE EXCEPTION 'Homepage changes require an authenticated audit actor';
  END IF;
  INSERT INTO public_commerce_homepage_version_audit
    (identity_id, homepage_id, window_id, actor_account_id, action)
  VALUES (
    COALESCE(to_jsonb(NEW)->>'identity_id', to_jsonb(OLD)->>'identity_id'),
    CASE WHEN TG_TABLE_NAME = 'public_commerce_homepage_versions'
      THEN COALESCE(to_jsonb(NEW)->>'homepage_id', to_jsonb(OLD)->>'homepage_id') END,
    CASE WHEN TG_TABLE_NAME = 'public_commerce_homepage_windows'
      THEN COALESCE(to_jsonb(NEW)->>'window_id', to_jsonb(OLD)->>'window_id') END,
    actor,
    TG_ARGV[0]
  );
  RETURN COALESCE(NEW, OLD);
END $$;
--> statement-breakpoint
INSERT INTO public_commerce_homepage_versions
  (homepage_id, identity_id, commerce_profile_id, state, is_default, created_at, updated_at)
SELECT
  'legacy-' || md5(h.identity_id),
  h.identity_id,
  h.commerce_profile_id,
  h.state,
  h.state = 'PUBLISHED',
  h.created_at,
  h.updated_at
FROM public_commerce_homepages h;
--> statement-breakpoint
INSERT INTO public_commerce_homepage_version_audit
  (identity_id, homepage_id, actor_account_id, action, occurred_at)
SELECT identity_id, 'legacy-' || md5(identity_id), 'migration:0030', 'MIGRATED', now()
FROM public_commerce_homepage_versions;
--> statement-breakpoint
CREATE TRIGGER public_commerce_homepage_version_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public_commerce_homepage_versions FOR EACH ROW
  EXECUTE FUNCTION audit_public_commerce_homepage_version('VERSION_CHANGED');
--> statement-breakpoint
CREATE TRIGGER public_commerce_homepage_window_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public_commerce_homepage_windows FOR EACH ROW
  EXECUTE FUNCTION audit_public_commerce_homepage_version('WINDOW_CHANGED');
