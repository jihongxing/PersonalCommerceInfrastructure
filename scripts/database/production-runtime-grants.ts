export const fulfillmentRuntimeGrant = `
GRANT UPDATE (fulfillment_status, fulfillment_confirmed_at) ON public.commerce_actions TO pci_api_runtime;
`;

export const membershipRuntimeGrants = `
GRANT SELECT, INSERT ON public.membership_offerings, public.membership_applications,
  public.commercial_memberships, public.membership_facts TO pci_api_runtime;
GRANT UPDATE (data) ON public.membership_offerings TO pci_api_runtime;
`;

export const programRuntimeGrants = `
GRANT SELECT, INSERT, UPDATE ON public.program_offerings, public.program_runs,
  public.program_sessions, public.program_applications, public.program_enrollments,
  public.program_attendance, public.program_completions, public.program_audits
  TO pci_api_runtime;
`;

export const goodsRuntimeGrants = `
GRANT SELECT, INSERT, UPDATE ON public.goods_offerings, public.goods_orders TO pci_api_runtime;
GRANT SELECT, INSERT ON public.goods_order_acceptances, public.goods_commitments,
  public.goods_deliveries, public.goods_buyer_receipts, public.goods_cancellation_proposals,
  public.goods_audits TO pci_api_runtime;
GRANT UPDATE (revision, state, data, updated_at) ON public.goods_offerings TO pci_api_runtime;
GRANT UPDATE (state, data, updated_at) ON public.goods_orders TO pci_api_runtime;
`;

export const productionRuntimeGrants = `
GRANT SELECT (id,email,password_hash,name,created_at,is_active), INSERT (id,email,password_hash,name), UPDATE (password_hash) ON public.local_auth_accounts TO pci_api_runtime;
GRANT SELECT (account_id,creator_id), INSERT (account_id,creator_id) ON public.local_creator_mappings TO pci_api_runtime;
GRANT SELECT (id,account_id,refresh_hash,expires_at,revoked_at), INSERT (id,account_id,refresh_hash,expires_at), UPDATE (refresh_hash,revoked_at) ON public.local_auth_sessions TO pci_api_runtime;
GRANT SELECT (account_id,token_hash,expires_at), INSERT (account_id,token_hash,expires_at), DELETE ON public.local_auth_password_resets TO pci_api_runtime;
GRANT SELECT (id,email,expires_at,attempts,lease_id,lease_until,available_at,created_at,issued), INSERT (id,email,expires_at), UPDATE (attempts,lease_id,lease_until,available_at,issued), DELETE ON public.local_auth_password_recovery_requests TO pci_api_runtime;

GRANT SELECT, INSERT ON public.identities, public.account_identity_memberships,
  public.commerce_profiles, public.commerce_references, public.external_platform_accounts,
  public.commerce_relationships, public.commerce_identities, public.creator_capabilities,
  public.service_offerings, public.distribution_assets, public.customers, public.commerce_actions,
  public.fulfillment_codes, public.product_events, public.public_commerce_homepage_versions,
  public.public_commerce_homepage_windows, public.availability_slots, public.reservations,
  public.commercial_contracts, public.commercial_contract_scope_versions,
  public.commercial_contract_acceptance_facts, public.paid_service_orders,
  public.paid_commerce_payments, public.paid_commerce_fulfillments, public.paid_commerce_settlements,
  public.paid_commerce_withdrawals, public.creator_earnings_ledger_entries,
  public.operations_action_audits
  TO pci_api_runtime;
GRANT SELECT ON public.service_policy_releases, public.service_policy_capabilities,
  public.service_policy_templates, public.provider_fact_observations TO pci_api_runtime;
${membershipRuntimeGrants}
${programRuntimeGrants}
${goodsRuntimeGrants}
GRANT INSERT (identity_id,homepage_id,window_id,actor_account_id,action) ON public.public_commerce_homepage_version_audit TO pci_api_runtime;
GRANT DELETE ON public.creator_capabilities TO pci_api_runtime;

GRANT UPDATE (lifecycle, updated_at) ON public.identities, public.commerce_references, public.external_platform_accounts, public.commerce_relationships TO pci_api_runtime;
GRANT UPDATE (state, updated_at, revoked_at) ON public.account_identity_memberships TO pci_api_runtime;
GRANT UPDATE (display_name, lifecycle, updated_at) ON public.commerce_profiles TO pci_api_runtime;
GRANT UPDATE (display_name, bio, avatar_url, location, social_links, state, updated_at) ON public.commerce_identities TO pci_api_runtime;
GRANT UPDATE (name, description, catalog_item_id, catalog_status, policy_version) ON public.creator_capabilities TO pci_api_runtime;
GRANT UPDATE (capability_ids, template_id, title, description, availability_description, appearance, request_instructions, state, policy_status, policy_reason, policy_version, updated_at) ON public.service_offerings TO pci_api_runtime;
GRANT UPDATE (public_url, state, updated_at) ON public.distribution_assets TO pci_api_runtime;
GRANT UPDATE (state, request_message, result_access_token, updated_at) ON public.commerce_actions TO pci_api_runtime;
${fulfillmentRuntimeGrant}
GRANT UPDATE (status, fulfilled_at, updated_at) ON public.fulfillment_codes TO pci_api_runtime;
GRANT UPDATE (commerce_profile_id, state, is_default, updated_at) ON public.public_commerce_homepage_versions TO pci_api_runtime;
GRANT UPDATE (starts_at, ends_at, time_zone, state, updated_at) ON public.public_commerce_homepage_windows TO pci_api_runtime;
GRANT UPDATE (state, updated_at) ON public.availability_slots, public.paid_service_orders, public.paid_commerce_settlements TO pci_api_runtime;
GRANT UPDATE (availability_slot_id, state, confirmed_at, cancelled_at, cancelled_by, rescheduled_at, order_id, snapshot, reschedule_history, updated_at) ON public.reservations TO pci_api_runtime;
GRANT UPDATE (state, current_scope_version_id, proposed_at, proposal_expires_at, accepted_at, accepted_by, contracted_at, order_id, rejected_at, cancelled_at, cancelled_by, updated_at) ON public.commercial_contracts TO pci_api_runtime;
GRANT UPDATE (state, provider_reference, updated_at) ON public.paid_commerce_payments, public.paid_commerce_withdrawals TO pci_api_runtime;
GRANT UPDATE (state, fulfilled_at) ON public.paid_commerce_fulfillments TO pci_api_runtime;
GRANT SELECT (id_hash,account_id,user_email,access_token_ciphertext,refresh_token_ciphertext,refresh_token_hash,expires_at,revoked_at),
  INSERT (id_hash,account_id,user_email,access_token_ciphertext,refresh_token_ciphertext,refresh_token_hash,expires_at),
  UPDATE (access_token_ciphertext,refresh_token_ciphertext,refresh_token_hash,updated_at,revoked_at)
  ON public.creator_web_sessions TO pci_creator_bff_runtime;
`;
