BEGIN;
CREATE SCHEMA pci_deployment;
REVOKE ALL ON SCHEMA pci_deployment FROM PUBLIC;
CREATE TABLE pci_deployment.installation (
    singleton boolean PRIMARY KEY CHECK (singleton),
    state text NOT NULL CHECK (state IN ('pending', 'provisioned', 'installing', 'ready')),
    fingerprint text,
    CHECK ((state IN ('installing', 'ready')) = (fingerprint IS NOT NULL))
);
CREATE TABLE pci_deployment.migration_checkpoint (
    migration_count integer PRIMARY KEY CHECK (migration_count IN (40, 41, 45, 46)),
    fingerprint text NOT NULL CHECK (fingerprint ~ '^[0-9a-f]{64}$')
);
INSERT INTO pci_deployment.installation (singleton, state) VALUES (true, 'pending');
COMMIT;
