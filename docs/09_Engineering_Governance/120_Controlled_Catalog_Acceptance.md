# 120 — Controlled Catalog Database & Admin Lifecycle Acceptance

> Task: PCI-ENG-010; date: 2026-11-12 (Asia/Shanghai).
> Overall: PARTIAL. Database migration and implemented Catalog/Operations verification: PASS / TESTED.
> DEV-082/083 full product acceptance: NOT_ACCEPTED; unresolved requirements are listed below.
> Baseline: f27e55b61c3f84edde8a3c3a87ed7f2632c2616f.
> Code/regression commit: 9a1b7a535dcbdcd7271d4161bc5a647bf717e137.
> Final clean rounds: 79 PASS / 0 FAIL / 0 SKIPPED each.

## 0. Executive Summary

The existing database-managed Catalog was exercised against disposable official PostgreSQL 17.10.
Both rounds completed the full 36-migration clean installation, the historical 0000-0032 to
0033-0035 upgrade, no-op migration reruns, and real PostgreSQL administration/publication tests.
All original 13 database-gated cases from ENG-008/009 also passed in both rounds.

Demonstrated defects in atomic audit persistence, concurrent field updates and capability risk
enforcement were corrected within the existing contracts. Missing current Catalog references now
fail closed. No schema, migration, API shape, role, Identity, C-number or money setting changed.

This is not full DEV-082/083 acceptance: the 403 versus 401 authorization response conflict and
unimplemented report/appeal/manual-review record workflows remain unresolved. No such workflow
was invented. CONTROLLED_RECOVERY, incomplete Resume Gate and Pilot/production/money boundaries
remain unchanged.

## 1. DEV-082/083 Contract Inventory

Authority was read directly from [34 — DEV-082](../07_Product_Architecture/34_Controlled_Capability_Service_Publishing_Decision.md),
[35 — DEV-083](../07_Product_Architecture/35_Database_Managed_Capability_Service_Catalog_Decision.md),
the [PRD amendments](../07_Product_Architecture/20_MVP_PRD_VS01.md), execution records at
21:8683/8727 and the current control baseline. The IDs below organize this verification; they do
not introduce requirements or new product objects.

| Contract ID | Existing requirement / authority                                                                    | Current implementation                                                                                            | Required verification                                                             | Evidence / acceptance                                                          |
| ----------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| CC-01       | DB snapshot is runtime authority; 35:10-15, PRD:768                                                 | PostgreSQL Catalog Repository                                                                                     | API reflects DB lifecycle changes, no runtime JSON fallback                       | PASS; integration:236/444                                                      |
| CC-02       | Idempotent initial 10 capabilities, 10 templates, one release; 35:36-49                             | Migrations 0034/0035, JSON importer                                                                               | Full install, historic upgrade, repeated migrator/import                          | PASS; Sections 3-5/13                                                          |
| CC-03       | Preserve same IDs across release versions; 35:38-39                                                 | Composite primary keys                                                                                            | Duplicate same-version key fails; another version coexists                        | PASS; integration:637; SQLSTATE 23505                                          |
| CC-04       | Operations can change state, switches, risk; 35:29-33                                               | Two PATCH routes and Admin Service                                                                                | Authorization, persistence, audit, invalid input                                  | PASS / TESTED; integration:79/315/401/444/473/596                              |
| CC-05       | Non-Operations returns 403; 35:51                                                                   | Static Operations credentials return 401 when invalid; service rejects Creator actors with an authorization error | Exact status plus zero mutation                                                   | PARTIAL; protection PASS, response-contract conflict open                      |
| CC-06       | Every management change is auditable; 35:33/52                                                      | Audit rows with actor/reason/version/time/correlation and before/after values                                     | DB row, audit API, rollback on failed audit INSERT                                | PASS after fix; integration:79/694                                             |
| CC-07       | Draft/paused/retired and emergency switches block publication; 35:17-27                             | Domain policy, Capability selection, live public checks                                                           | Capability/template lifecycle and public/new Request rejection                    | PASS for exercised states; integration:315/401/444                             |
| CC-08       | Restore requires Operations/reason; 35:27                                                           | Same protected PATCH route                                                                                        | Paused to active and switch restoration                                           | PASS; integration:315/444; irreversible retirement interpretation remains open |
| CC-09       | Import before release; one published version, archive previous; 35:44-45                            | POST releases and Repository                                                                                      | Missing-version denial, existing version publication, atomicity, concurrent calls | PASS for loaded versions; integration:637/694/732                              |
| CC-10       | Existing catalog/template match and required fields; PRD:721-737                                    | Offering API and domain evaluation                                                                                | Missing/unknown/mismatched template and missing availability                      | PASS; integration:524/585                                                      |
| CC-11       | Low/review/prohibited/future policy gates; 34:141-174, PRD:741-749                                  | Current risk/term/scope rules                                                                                     | Actual API publication and persisted states                                       | PASS for current rules after capability-risk fix; integration:567/596/612/622  |
| CC-12       | Key edit rechecks, no false publication facts; PRD:727/760                                          | Offering update, public filtering, canonical events                                                               | Prohibited edit becomes rejected; history unchanged                               | PASS; integration:524; existing application regressions                        |
| CC-13       | Catalog changes constrain public Offering and new Request without rewriting history; 35:53, PRD:772 | Current-snapshot evaluation                                                                                       | Public rejection, existing Offering/action/event preservation                     | PASS; integration:315/401 and upgrade snapshots                                |
| CC-14       | Reimport preserves operational status/switches/audit; 35:40-42/54                                   | Transactional JSON import                                                                                         | Two imports after pause/retirement                                                | PASS; integration:773                                                          |
| CC-15       | Report, appeal and manual-review records; 34:218-228/267, PRD:726/759                               | No corresponding registered Catalog workflow or record API found                                                  | Complete authorized workflow evidence                                             | NOT_IMPLEMENTED / PARTIAL; no workflow added                                   |
| CC-16       | Existing VS-01 AT boundary; PRD:761                                                                 | Existing acceptance suites                                                                                        | Complete AT-001-AT-013 product acceptance                                         | NOT rerun here; focused regression is not full product acceptance              |

Actual management scope is listing/workspace, audit reading, state/switch/risk changes and release
publication. Generic Catalog Item/Template creation, deletion, rename and arbitrary policy editing
are not exposed by these APIs and are not inferred requirements. JSON import manages initialization
metadata. A separate Admin UI is not required by Decision 35.

## 2. Actual Catalog Architecture

```text
existing SQL migrations / reviewed JSON import
  -> service_policy_releases / capabilities / templates / audits
  -> PostgresServicePolicyCatalogRepository
  -> Creator Catalog API / Operations Admin Service
  -> Capability selection / Offering policy / public Offering and Request checks
```

Runtime composition passes the real database Repository and Admin Service to the server. The
new integration suite explicitly injects both, avoiding the API server's default in-memory
composition. Existing service-policy-api.test.ts alone does not establish PostgreSQL behavior.

Source: adapters/persistence/postgres/postgres-creator-identity-composition.ts:149/552;
apps/api/src/create-api-server.ts:143/378; adapters/transport/http/service-policy-routes.ts:72;
modules/service-policy/catalog.ts:136; database/schema/service-policy.ts:11.

## 3. Full Clean Migration Results

Deployment requests postgres:17.6-bookworm (deploy/compose.production.yml:3). No exact local image
was available. Used existing official docker.io/library/postgres:17, immutable image ID
1edc8e87e53194e0cc8006c4e9df9b626c6c72cb43ad3385f0f34af7922065b1; server reported PostgreSQL
17.10, version_num 170010. Exact 17.6-bookworm qualification is not claimed.

For each round, pci_eng010_clean was created empty. The normal scripts/database/migrate.ts entry
ran through the original complete journal, with DATABASE_URL provided only to that child process.
No selective Catalog-only installation, schema push, migration rewrite or journal repair was used.

All 36 original migration SQL hashes and journal timestamps matched the checked-in entries in
execution order. The four Catalog tables existed with four primary-key constraints and eleven
indexes, including the version uniqueness indexes. Existing 0030 installed btree_gist.
Seed metadata matched all fields of the checked-in ten capabilities and ten templates; the sole
initial release was v1/published. Initial audit was empty, keys were unique and all seed template
references resolved within their version.

## 4. Catalog Upgrade Migration Results

Each pci_eng010_upgrade database started empty and was migrated through 0032 using byte-identical
existing SQL and original journal entries 0-32 in a temporary prefix directory. This is the actual
pre-Catalog schema, not an invented historical model. The normal full migrator then applied the
remaining 0033-0035 and produced 36 matching journal entries.

Existing-schema fixtures were inserted before the upgrade: a known dance capability, an unknown
custom capability, a published Offering, Customer/Commerce Action, distributed asset and canonical
event. The known capability mapped to capability-dance-teaching/active/v1; the custom capability
remained unassociated/custom_request. The Offering kept its Creator and published business state,
acquired the matching dance template, and became not_checked/v1 rather than silently approved.

Existing Commerce Action, distribution asset and canonical-event rows remained byte-for-byte equal
in the serialized before/after snapshots. Both rounds preserved this history. This does not prove
every possible older production dataset or every earlier journal prefix.

## 5. Migration Repeatability

The normal full migrator was immediately rerun against all four clean/upgrade databases. Full
Catalog rows, template rows, release rows, audit rows and migration journal IDs/hashes/timestamps
were unchanged. Counts stayed 10/10/1, and versioned keys stayed stable.

The existing journal has non-monotonic timestamps at 0025/0026. No journal was altered; this task
verified empty installation and the required pre-Catalog 0032 upgrade, not every historic upgrade
starting point.

## 6. Catalog Data Integrity

| Area                      | Observed protection / evidence                                           | Result and limit                                                                           |
| ------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Capability identity/key   | PRIMARY KEY (id, policy_version), version unique index                   | Same-version duplicate fails with real 23505; same ID in another version persists          |
| Template identity/key     | PRIMARY KEY (id, policy_version), version unique index                   | Same-version duplicate fails with real 23505                                               |
| Release identity          | PRIMARY KEY (policy_version)                                             | Version publication updates the selected existing release or creates its release row       |
| Audit identity            | PRIMARY KEY (id)                                                         | Actual row plus audit API verified                                                         |
| Template relationship     | Seed relationships valid; Offering policy rejects wrong/unknown template | PASS at tested business API boundary                                                       |
| Database foreign keys     | No Catalog foreign-key constraints in pg_constraint                      | No database-level referential guarantee claimed; no new FK added                           |
| Slug and vertical         | Seed values preserved; no independent slug uniqueness constraint         | ID/version is the actual key; no additional uniqueness promise invented                    |
| Lifecycle / switches      | Existing API enum/body checks and domain rules                           | Draft, paused, retired and disabled records block tested business paths                    |
| Risk / scope              | Existing low/review/prohibited and vs01/established/future fields        | Risk upgrade and future-scope rejection verified; no new policy dimensions                 |
| Historical business facts | Persisted Offering/action/event snapshots                                | No retroactive rewrite on tested Catalog changes or migration                              |
| Concurrent admin writes   | Transaction plus shared transaction-scoped advisory lock                 | Tested registered admin writers preserve both independent updates and truthful audit chain |
| Import                    | Existing importer transaction and composite-key upsert                   | No duplicates or clearing of paused/retired/switch/audit state                             |

Version publication currently checks that both capability and template sets are nonempty; it does
not validate every parent reference. A disposable fault fixture with a missing current capability
can therefore be published as a test version, but Offering publication now fails closed. This is
an explicit integrity limitation, not evidence of an authorized delete/import workflow.

## 7. Admin API Authorization

All five Operations endpoints were tested with no credentials, a real ordinary Creator token and
invalid Operations credentials. Every request was denied with HTTP 401 and complete Catalog,
release and audit snapshots were unchanged. Direct Admin Service invocation with a Creator actor
threw service_policy_operations_required with category authorization; the API maps that category to 403. Authorization is server-side.

Authorized test Operations credentials reached workspace, audit, both PATCH endpoints and POST
releases. Invalid state/risk, absent/blank reason and unknown IDs failed without mutation.

Decision 35:51 specifies 403 for non-Operations; the current authentication adapter explicitly
returns invalid_operations_access_token/401. This response-code conflict was recorded rather than
silently changing authentication semantics or describing 401 as 403. The access protection passes;
literal status-contract acceptance remains PARTIAL.

## 8. Admin Lifecycle Verification

| Entity / operation             | Initial state                            | Actor                                 | Result / business effect                                                                   | Evidence            |
| ------------------------------ | ---------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------- |
| Capability status              | active                                   | Operations with reason                | draft/paused/retired persisted; new association denied; publish/public/new Request blocked | Integration:315     |
| Capability restore             | paused                                   | Operations with reason                | active; existing draft can publish, existing public Offering becomes available             | Integration:315     |
| Template status                | active                                   | Operations with reason                | draft/paused/retired persisted; draft publication and existing public/new Request blocked  | Integration:401     |
| Selection / emergency switches | true                                     | Operations with reason                | false read back from DB/API and publication blocked; true restoration works                | Integration:444     |
| Risk changes                   | low                                      | Operations with reason                | review gives review_required/409; prohibited gives rejected/400                            | Integration:596/612 |
| Publish loaded release         | v1 published, copied test version loaded | Operations with reason                | new version published, v1 archived, audit version correct                                  | Integration:637     |
| Failed audit INSERT            | unchanged baseline                       | Operations request plus real DB fault | HTTP 500, transaction rolls back all entity/release/audit changes                          | Integration:694     |

Each successful update is verified in PostgreSQL and through the audit API with actor, reason,
version, correlation, timestamp and before/after values. Test isolation directly restores existing
seed rows between cases; this is not evidence that restoring retired to active is product-approved.
Decision 35 describes retired as permanent, while the generic update implementation has no
transition-specific retirement guard. That lifecycle interpretation remains a Controller decision.

## 9. Policy Versioning Verification

Version identity is policy_version; capabilities and templates also retain their separate metadata
version field. The second-version fixture copies the same existing ten capability/template records
under eng010-v2, without adding a category, vertical, permission or newly approved service type.
It is disposable test data, not a real published product policy.

The suite verifies an unloaded version is rejected with the existing 400 response and no mutation;
two versions can coexist under composite keys; publishing the loaded test version returns 204,
archives v1 and changes the runtime snapshot; v1 business Offering rows are not rewritten. Audit
records carry the version of the committed operation rather than a later independently read version.

No arbitrary-version upload API, generic policy CRUD or version-conflict response was invented. The
current importer reads the checked-in JSON snapshot (v1); publication of a loaded second version
does not qualify an unimplemented end-to-end authoring/import workflow.

## 10. Creator-Facing Policy Enforcement

The real API/PostgreSQL chain passed for eligible dance selection and publication, custom-request
409 rejection, draft/paused/retired Capability and Template, selection/publication switches, missing
current capability, unknown/mismatched/missing template, absent availability, prohibited edits,
capability/template risk updates and an existing future-scope template remaining review_required.

Successful publication persists published/approved and one creator_published canonical event with
actor/object equal to the Offering's Creator. This remains a Creator identity fact, not a new
Offering event. Rejected drafts have no request-correlated event and no Distribution Asset.
Catalog lifecycle changes block public Offering reads and new Requests without rewriting existing
Offering/action/event facts. The original ENG-009 correlation/privacy cases passed unchanged.

## 11. Concurrency and Transaction Results

Before the production fix, a real PostgreSQL audit trigger failure left committed capability,
template or release changes despite HTTP 500. Concurrent updates of creatorSelectable and
publishEnabled also lost one change. Diagnostic evidence is retained separately from final runs.

The Repository now writes each operation and its audit in one transaction and serializes registered
admin writers with pg_advisory_xact_lock(hashtext('pci.service-policy.catalog')). Readers use a
repeatable-read snapshot. The suite verifies rollback for all three write paths, one published
release after concurrent version calls, both independent field changes, and matching consecutive
audit before/after state. This is application-level serialization, not an inferred property of an
index or proof against arbitrary external SQL writers.

Capability-level risk escalation previously still published with HTTP 200; the current policy now
honors that existing risk field. The missing-reference .find/undefined ambiguity was replaced with
an explicit availability predicate. Prohibited template risk remains stronger than capability
review risk. API resources, roles, schemas and canonical events did not change.

Existing PostgreSQL Capability concurrency, TCP interruption and SQLSTATE 42501 recovery tests
were reused and passed. Concurrent publication of the same Offering, optimistic CAS and stress
linearizability were not newly qualified; no stronger guarantee is claimed.

## 12. Web V2 Admin Surface

No Web V2 Catalog/Operations administration page or service-policy Operations API caller was found.
Decision 35 requires protected APIs, not an Admin UI, so this is NOT_APPLICABLE rather than an
invented UI requirement. No UI was added.

Creator surfaces do call /api/v1/creator/service-catalog through apiClient; there is no hardcoded
Catalog fallback in that hook. Failures throw the actual server message or an explicit empty-data
error. Source inspection: use-service-catalog.ts:35, capability-form.tsx:27/110, service-form.tsx:52/201,
apps/web-v2/lib/api/client.ts:15.

The hook caches for five minutes; selectors currently filter active but do not include both switches
in their client-side filter, and Catalog DTO status unions differ from the server's four states.
Server-side denial was verified despite UI bypass. These are frontend synchronization limitations,
not a claim of fresh browser/Admin UI acceptance. No browser end-to-end session was run.

## 13. Repeatability Results

| File / scope                                                | Round 1                   | Round 2                   |
| ----------------------------------------------------------- | ------------------------- | ------------------------- |
| controlled-catalog.postgres.test.ts                         | 25 PASS                   | 25 PASS                   |
| catalog.test.ts                                             | 7 PASS                    | 7 PASS                    |
| service-policy-admin-service.test.ts                        | 2 PASS                    | 2 PASS                    |
| service-policy-api.test.ts (existing in-memory composition) | 2 PASS                    | 2 PASS                    |
| service-offering-use-cases.test.ts                          | 8 PASS                    | 8 PASS                    |
| customer-request-use-cases.test.ts                          | 12 PASS                   | 12 PASS                   |
| local-auth.integration.test.ts                              | 6 PASS                    | 6 PASS                    |
| capability-management.test.ts                               | 6 PASS                    | 6 PASS                    |
| request-tracing.test.ts                                     | 11 PASS                   | 11 PASS                   |
| Total                                                       | 79 PASS / 0 FAIL / 0 SKIP | 79 PASS / 0 FAIL / 0 SKIP |

The exact nine files were passed to the existing Vitest runner with JSON reporting. Each round
created fresh clean/upgrade databases and a separate fully migrated pci_tracing_disposable database
for the original network/permission tests; all six databases were dropped. PG06 retains its original
database-gated suite placement but its unavailable-mail assertion does not itself query PostgreSQL.

pnpm typecheck:active, pnpm typecheck:active-tests:backend, focused ESLint, changed-file Prettier
and git diff --check passed. Full root lint/typecheck/preflight, all ATs, production build and
external service qualification were not run or claimed.

## 14. Cleanup Verification

Final run: 2026-11-11T21:26:20.794Z to 21:28:12.602Z, November 12 05:26-05:28 Asia/Shanghai.
Task container pci-eng-010-p0epon used --rm, task label, random temporary credentials, 1 GiB tmpfs
and only 127.0.0.1:40355. No existing container/volume/database was reused. Global .env and parent
environment were unchanged; database URLs existed only in child maps and memory.

All six final-run databases were deleted; connection counts were zero before normal drops and no
tracing_fault_* role remained. The task container was absent and port closed. All 52 unrelated
container snapshots and 55 volume names matched before/after; no volume or system prune was used.
Every diagnostic attempt also ran its finally cleanup. Temporary migration-prefix directories were
removed; temporary executor removal and final independent resource check are recorded in the ledger.

Local evidence directory: E:/User/jihx/AppData/Local/Temp/pci-eng-010-p0Epon. summary.json retains
journal hashes, Catalog rows, constraints/indexes, before/after history and cleanup. round-1.json/log
and round-2.json/log retain all case results; evidence-audit.json verifies both rounds against source
seed metadata and journal entries. Artifacts are sanitized local evidence, not durable Git objects.

## 15. Product and Technical Gaps

| Gap                                      | Existing evidence                                                                                                   | Disposition                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| G1 — 403/401 conflict                    | Decision 35:51 versus static Operations adapter and 15 real API denials                                             | PARTIAL; Controller must reconcile contract/transport meaning; no silent API change                   |
| G2 — report/appeal/manual review records | Decision 34:218/267 and PRD:726/759 versus actual five Operations endpoints and two entity types plus release audit | NOT_IMPLEMENTED; no new workflow authorized by this task                                              |
| G3 — permanent retirement interpretation | Decision 35:24 versus generic status PATCH                                                                          | Requires decision on irreversible/per-version retirement; no forbidden transition treated as accepted |
| G4 — reference/import guarantees         | No Catalog FKs; release checks nonempty sets, importer is checked-in snapshot                                       | Record actual limitation; no new schema constraint or arbitrary-version authoring flow added          |
| G5 — Web V2 synchronization              | Five-minute cache, active-only filters and mismatched status DTO                                                    | Frontend behavior not fully accepted; server gate verified                                            |
| G6 — full product/environment acceptance | All ATs and exact deployment image not qualified here                                                               | TESTED only; no external/Pilot/production acceptance                                                  |

G4 is not an invented requirement for new FKs or CRUD. Existing seed/API relations passed; the
absence of a stronger database/import guarantee is stated explicitly. Exact image fallback is
permitted by ENG-010 and is a qualification limit, not a failed migration result.

## 16. Documentation and Git Commits

Code and regression are in 9a1b7a535dcbdcd7271d4161bc5a647bf717e137, changing only the PostgreSQL
Catalog Repository, existing policy evaluator and new PostgreSQL integration suite. Documentation
is a separate commit updating this record, the execution ledger and current control baseline.
Historical DEV-082/083 and ENG-008/009 evidence remains intact. No frozen product document,
migration, policy seed, permission or money configuration was edited; no push was performed.

Verified SHA-256 values:

- Repository: 02fb9cf1e60effc27fb08ff3462062e88a6054ad1a609c0142a7c9e943b30c02.
- Policy evaluator: ced98111a9d127a8f24270a9ca7e7b003204f4e7850473bb6f4fdb3daf445a8a.
- New integration suite: f64c8e441e38561b0e5f9049787e9e5f4233812a1bb1a4b0436f23a625a7d8da.

## 17. Main Controller Handoff

The Controller can adopt the scoped full-install, 0032-upgrade, rerun and implemented Operations
engineering evidence as PASS / TESTED. Overall ENG-010 and full DEV-082/083 acceptance remain
PARTIAL / NOT_ACCEPTED because G1-G3 and the broader product workflow boundary are unresolved.

Resolve G1 against existing authentication/API authority; clarify retirement semantics and define
the existing report/appeal/manual-review scope before assigning implementation. Reprioritizing or
removing a previously approved product requirement needs the appropriate product/Founder decision.
Evidence adoption, technical triage and verification assignment do not themselves require new
strategic authorization. No full Stage 2, Resume Gate, Pilot, production or real-money authorization
is granted by this document.
