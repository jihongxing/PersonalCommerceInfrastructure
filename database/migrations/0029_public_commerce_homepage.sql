ALTER TABLE commerce_profiles ADD CONSTRAINT commerce_profiles_identity_profile_unique
  UNIQUE (owning_identity_id, commerce_profile_id);
--> statement-breakpoint
CREATE TABLE public_commerce_homepages (
  identity_id varchar(128) PRIMARY KEY REFERENCES identities(identity_id) ON DELETE RESTRICT,
  commerce_profile_id varchar(128),
  state varchar(32) NOT NULL DEFAULT 'UNPUBLISHED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_commerce_homepages_state_check
    CHECK (state IN ('UNPUBLISHED', 'PUBLISHED', 'PAUSED')),
  CONSTRAINT public_commerce_homepages_published_profile_check
    CHECK (state = 'UNPUBLISHED' OR commerce_profile_id IS NOT NULL),
  CONSTRAINT public_commerce_homepages_owned_profile_fk
    FOREIGN KEY (identity_id, commerce_profile_id)
    REFERENCES commerce_profiles (owning_identity_id, commerce_profile_id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE public_commerce_homepage_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identity_id varchar(128) NOT NULL REFERENCES identities(identity_id) ON DELETE RESTRICT,
  actor_account_id varchar(256) NOT NULL CHECK (actor_account_id <> ''),
  old_state varchar(32),
  new_state varchar(32) NOT NULL,
  old_profile_id varchar(128),
  new_profile_id varchar(128),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE FUNCTION audit_public_commerce_homepage() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  actor text := current_setting('pci.homepage_actor', true);
BEGIN
  IF actor IS NULL OR actor = '' THEN
    RAISE EXCEPTION 'Homepage changes require an authenticated audit actor';
  END IF;
  INSERT INTO public_commerce_homepage_audit
    (identity_id, actor_account_id, old_state, new_state, old_profile_id, new_profile_id)
  VALUES (NEW.identity_id, actor, CASE WHEN TG_OP = 'UPDATE' THEN OLD.state END,
    NEW.state, CASE WHEN TG_OP = 'UPDATE' THEN OLD.commerce_profile_id END, NEW.commerce_profile_id);
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER public_commerce_homepage_audit_trigger
  AFTER INSERT OR UPDATE ON public_commerce_homepages FOR EACH ROW
  EXECUTE FUNCTION audit_public_commerce_homepage();
