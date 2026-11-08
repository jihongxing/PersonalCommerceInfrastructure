LOCK TABLE commerce_references, commerce_profiles, identities IN ACCESS EXCLUSIVE MODE;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM commerce_references r
    LEFT JOIN commerce_profiles p ON p.commerce_profile_id = r.commerce_profile_id
    LEFT JOIN identities i ON i.identity_id = p.owning_identity_id
    WHERE p.commerce_profile_id IS NULL OR i.identity_id IS NULL
      OR r.commerce_reference !~ '^[3479ACDEFHJKMNPQRTVWXY]{18}$'
      OR r.lifecycle NOT IN ('ASSIGNED', 'PERMANENTLY_RESERVED')
  ) THEN
    RAISE EXCEPTION 'C number migration stopped: invalid reference or missing profile/identity';
  END IF;
  IF EXISTS (
    SELECT p.owning_identity_id FROM commerce_references r
    JOIN commerce_profiles p ON p.commerce_profile_id = r.commerce_profile_id
    GROUP BY p.owning_identity_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'C number migration stopped: an identity owns multiple historical references';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE commerce_references ADD COLUMN identity_id varchar(128);
--> statement-breakpoint
UPDATE commerce_references r SET identity_id = p.owning_identity_id
FROM commerce_profiles p WHERE p.commerce_profile_id = r.commerce_profile_id;
--> statement-breakpoint
ALTER TABLE commerce_references ALTER COLUMN identity_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE commerce_references ALTER COLUMN commerce_profile_id DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE commerce_references ADD CONSTRAINT commerce_references_identity_id_unique UNIQUE (identity_id);
--> statement-breakpoint
ALTER TABLE commerce_references ADD CONSTRAINT commerce_references_identity_id_identities_identity_id_fk FOREIGN KEY (identity_id) REFERENCES identities(identity_id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE commerce_references ADD CONSTRAINT commerce_references_format_check CHECK (commerce_reference ~ '^[3479ACDEFHJKMNPQRTVWXY]{18}$');
--> statement-breakpoint
CREATE FUNCTION protect_commerce_reference_ownership() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Commerce Reference records cannot be deleted';
  END IF;
  IF NEW.commerce_reference IS DISTINCT FROM OLD.commerce_reference OR NEW.identity_id IS DISTINCT FROM OLD.identity_id OR NEW.commerce_profile_id IS DISTINCT FROM OLD.commerce_profile_id OR NEW.assigned_at IS DISTINCT FROM OLD.assigned_at OR NEW.created_at IS DISTINCT FROM OLD.created_at OR (OLD.lifecycle = 'PERMANENTLY_RESERVED' AND NEW.lifecycle <> OLD.lifecycle) THEN
    RAISE EXCEPTION 'Commerce Reference ownership and history are immutable';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER commerce_reference_ownership_immutable BEFORE UPDATE OR DELETE ON commerce_references FOR EACH ROW EXECUTE FUNCTION protect_commerce_reference_ownership();
