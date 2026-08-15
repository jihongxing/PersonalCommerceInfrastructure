'use client';

import { useEffect, useMemo, useState } from 'react';

import { loadWebConfiguration } from '../configuration/bootstrap';
import { commonCopy, creatorIdentityCopy } from '../content/user-facing-copy';
import { createApiClient } from '../lib/api/client';
import type { operations } from '../lib/api/generated';
import {
  identityStateLabel,
  missingPublishConditionLabels,
  offeringStateLabel,
  toUserFacingMessage,
} from '../lib/ui/user-facing-messages';
import { Button } from './ui/button';
import { EmptyState } from './ui/empty-state';
import { FormField } from './ui/form-field';
import { Input } from './ui/input';
import { StatusMessage } from './ui/status-message';
import { Surface } from './ui/surface';
import { Textarea } from './ui/textarea';
import type { AccessTokenProvider } from '../lib/api/authentication';

type IdentityResponse =
  operations['getCreatorIdentity']['responses'][200]['content']['application/json'];
type OfferingResponse =
  operations['listCreatorServiceOfferings']['responses'][200]['content']['application/json']['offerings'][number];
type CreatorRequest =
  operations['listCreatorSubmittedRequests']['responses'][200]['content']['application/json']['requests'][number];

const defaultProfile = {
  displayName: '',
  bio: '',
  socialLinks: [],
};

export function CreatorIdentityWorkspace({
  accessTokenProvider,
  onSignOut,
  userEmail,
}: {
  readonly accessTokenProvider: AccessTokenProvider;
  readonly onSignOut: () => void;
  readonly userEmail: string | null;
}) {
  const [identity, setIdentity] = useState<IdentityResponse | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [capabilityName, setCapabilityName] = useState('');
  const [capabilityDescription, setCapabilityDescription] = useState('');
  const [offerings, setOfferings] = useState<readonly OfferingResponse[]>([]);
  const [requests, setRequests] = useState<readonly CreatorRequest[]>([]);
  const [distributionAssets, setDistributionAssets] = useState<
    Readonly<Record<string, { readonly publicUrl: string; readonly state: string }>>
  >({});
  const [editingOfferingId, setEditingOfferingId] = useState<string | null>(null);
  const [offeringTitle, setOfferingTitle] = useState('');
  const [offeringDescription, setOfferingDescription] = useState('');
  const [availabilityDescription, setAvailabilityDescription] = useState('');
  const [requestInstructions, setRequestInstructions] = useState('');
  const [selectedCapabilityId, setSelectedCapabilityId] = useState('');
  const [message, setMessage] = useState<string>(creatorIdentityCopy.loading);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const client = useMemo(
    () =>
      createApiClient({
        apiBaseUrl: loadWebConfiguration().apiBaseUrl,
        accessTokenProvider,
      }),
    [accessTokenProvider],
  );

  useEffect(() => {
    setHydrated(true);
    void loadIdentity();
  }, []);

  async function loadIdentity(): Promise<void> {
    setBusy(true);
    try {
      const response = await client.GET('/api/v1/creator/identity');

      if (response.error !== undefined) {
        setIdentity(null);
        if (
          response.error.error.code === 'missing_auth_context' ||
          response.error.error.code === 'invalid_access_token' ||
          response.error.error.code === 'creator_actor_not_mapped'
        ) {
          onSignOut();
          setMessage(creatorIdentityCopy.sessionExpired);
        } else {
          setMessage(creatorIdentityCopy.identityMissing);
        }
        return;
      }

      setIdentity(response.data);
      setDisplayName(response.data.profile.displayName);
      setBio(response.data.profile.bio);
      setMessage(creatorIdentityCopy.identityLoaded);
      await Promise.all([loadOfferings(), loadRequests()]);
    } catch {
      setIdentity(null);
      setMessage(creatorIdentityCopy.identityLoadFailed);
    } finally {
      setBusy(false);
    }
  }

  async function loadOfferings(): Promise<void> {
    try {
      const response = await client.GET('/api/v1/creator/offerings');

      if (response.error === undefined) {
        setOfferings(response.data.offerings);
      }
    } catch {
      setOfferings([]);
    }
  }

  async function loadRequests(): Promise<void> {
    try {
      const response = await client.GET('/api/v1/creator/requests');

      if (response.error === undefined) {
        setRequests(response.data.requests);
      }
    } catch {
      setRequests([]);
    }
  }

  async function decideRequest(actionId: string, decision: 'confirm' | 'decline'): Promise<void> {
    setBusy(true);
    try {
      const response =
        decision === 'confirm'
          ? await client.POST('/api/v1/creator/requests/{actionId}/confirm', {
              params: { path: { actionId } },
            })
          : await client.POST('/api/v1/creator/requests/{actionId}/decline', {
              params: { path: { actionId } },
            });

      if (response.error !== undefined) {
        setMessage(toUserFacingMessage(response.error, creatorIdentityCopy.requestDecisionFailed));
        return;
      }

      setRequests((current) =>
        current.filter((request) => request.action.id !== response.data.actionId),
      );
      setMessage(
        decision === 'confirm'
          ? creatorIdentityCopy.requestConfirmed
          : creatorIdentityCopy.requestDeclined,
      );
    } catch {
      setMessage(creatorIdentityCopy.requestDecisionFailed);
    } finally {
      setBusy(false);
    }
  }

  async function saveIdentity(): Promise<void> {
    setBusy(true);
    const body = {
      profile: {
        displayName,
        bio,
        socialLinks: identity?.profile.socialLinks ?? defaultProfile.socialLinks,
        ...(identity?.profile.avatarUrl === undefined
          ? {}
          : { avatarUrl: identity.profile.avatarUrl }),
        ...(identity?.profile.location === undefined
          ? {}
          : { location: identity.profile.location }),
      },
    };
    try {
      const response =
        identity === null
          ? await client.POST('/api/v1/creator/identity', { body })
          : await client.PATCH('/api/v1/creator/identity', { body });

      if (response.error !== undefined) {
        setMessage(toUserFacingMessage(response.error, creatorIdentityCopy.identitySaveFailed));
        return;
      }

      setIdentity(response.data);
      setMessage(
        identity === null ? creatorIdentityCopy.identityCreated : creatorIdentityCopy.identitySaved,
      );
    } catch {
      setMessage(creatorIdentityCopy.identitySaveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function addCapability(): Promise<void> {
    setBusy(true);
    try {
      const response = await client.POST('/api/v1/creator/identity/capabilities', {
        body: {
          name: capabilityName,
          description: capabilityDescription,
        },
      });

      if (response.error !== undefined) {
        setMessage(toUserFacingMessage(response.error, creatorIdentityCopy.serviceSaveFailed));
        return;
      }

      setIdentity(response.data);
      setCapabilityName('');
      setCapabilityDescription('');
      setMessage(creatorIdentityCopy.serviceAdded);
    } catch {
      setMessage(creatorIdentityCopy.serviceSaveFailed);
    } finally {
      setBusy(false);
    }
  }

  function resetOfferingForm(): void {
    setEditingOfferingId(null);
    setOfferingTitle('');
    setOfferingDescription('');
    setAvailabilityDescription('');
    setRequestInstructions('');
    setSelectedCapabilityId('');
  }

  function editOffering(offering: OfferingResponse): void {
    setEditingOfferingId(offering.id);
    setOfferingTitle(offering.title);
    setOfferingDescription(offering.description);
    setAvailabilityDescription(offering.availabilityDescription ?? '');
    setRequestInstructions(offering.requestInstructions);
    setSelectedCapabilityId(offering.capabilityIds[0] ?? '');
  }

  async function saveOffering(): Promise<void> {
    setBusy(true);
    const body = {
      capabilityIds: selectedCapabilityId.length === 0 ? [] : [selectedCapabilityId],
      title: offeringTitle,
      description: offeringDescription,
      ...(availabilityDescription.trim().length === 0 ? {} : { availabilityDescription }),
      requestInstructions,
    };

    try {
      const response =
        editingOfferingId === null
          ? await client.POST('/api/v1/creator/offerings', { body })
          : await client.PATCH('/api/v1/creator/offerings/{offeringId}', {
              params: { path: { offeringId: editingOfferingId } },
              body,
            });

      if (response.error !== undefined) {
        setMessage(toUserFacingMessage(response.error, creatorIdentityCopy.offeringSaveFailed));
        return;
      }

      await loadOfferings();
      editOffering(response.data);
      setMessage(creatorIdentityCopy.offeringSaved);
    } catch {
      setMessage(creatorIdentityCopy.offeringSaveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function publishOffering(offeringId: string): Promise<void> {
    setBusy(true);
    try {
      const response = await client.POST('/api/v1/creator/offerings/{offeringId}/publish', {
        params: { path: { offeringId } },
      });

      if (response.error !== undefined) {
        setMessage(toUserFacingMessage(response.error, creatorIdentityCopy.offeringPublishFailed));
        return;
      }

      await loadOfferings();
      setDistributionAssets((current) => ({
        ...current,
        [offeringId]: response.data.distributionAsset,
      }));
      setMessage(creatorIdentityCopy.offeringPublished);
    } catch {
      setMessage(creatorIdentityCopy.offeringPublishFailed);
    } finally {
      setBusy(false);
    }
  }

  async function unpublishOffering(offeringId: string): Promise<void> {
    setBusy(true);
    try {
      const response = await client.POST('/api/v1/creator/offerings/{offeringId}/unpublish', {
        params: { path: { offeringId } },
      });

      if (response.error !== undefined) {
        setMessage(
          toUserFacingMessage(response.error, creatorIdentityCopy.offeringUnpublishFailed),
        );
        return;
      }

      await loadOfferings();
      setMessage(creatorIdentityCopy.offeringUnpublished);
    } catch {
      setMessage(creatorIdentityCopy.offeringUnpublishFailed);
    } finally {
      setBusy(false);
    }
  }

  async function recordExternalDistribution(offeringId: string): Promise<void> {
    setBusy(true);
    try {
      const response = await client.POST('/api/v1/creator/offerings/{offeringId}/distribution', {
        params: { path: { offeringId } },
      });

      if (response.error !== undefined) {
        setMessage(
          toUserFacingMessage(response.error, creatorIdentityCopy.offeringDistributionFailed),
        );
        return;
      }

      setDistributionAssets((current) => ({
        ...current,
        [offeringId]: response.data,
      }));
      setMessage(creatorIdentityCopy.offeringDistributed);
    } catch {
      setMessage(creatorIdentityCopy.offeringDistributionFailed);
    } finally {
      setBusy(false);
    }
  }

  async function copyShareUrl(publicUrl: string): Promise<void> {
    await navigator.clipboard.writeText(publicUrl);
    setMessage(creatorIdentityCopy.offeringShareCopied);
  }

  return (
    <main className="ds-workspace-page ds-page">
      <header className="ds-workspace-header">
        <div className="ds-workspace-brand">
          <span className="ds-brand-mark" aria-hidden="true" />
          <span>{commonCopy.brand}</span>
        </div>
        <span className="ds-header-note">{commonCopy.creatorWorkspace}</span>
      </header>
      <Surface className="ds-page__surface" tone="raised">
        <div className="ds-workspace-intro">
          <div>
            <p className="ds-eyebrow">{creatorIdentityCopy.eyebrow}</p>
            <h1 className="ds-heading-page">{creatorIdentityCopy.title}</h1>
          </div>
          <div className="ds-action-row">
            <span className="ds-workspace-profile">{userEmail ?? commonCopy.creatorRole}</span>
            <Button onClick={onSignOut} type="button" variant="outline">
              {creatorIdentityCopy.signOut}
            </Button>
          </div>
        </div>
        <p className="ds-body-secondary ds-measure">{creatorIdentityCopy.setupDescription}</p>
        <StatusMessage>
          {hydrated
            ? busy
              ? creatorIdentityCopy.syncing
              : message
            : creatorIdentityCopy.initializing}
        </StatusMessage>

        <div className="ds-form-grid">
          <FormField htmlFor="display-name" label={creatorIdentityCopy.displayNameLabel}>
            <Input
              id="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </FormField>
          <Surface className="ds-status-card" tone="subtle">
            <span>{creatorIdentityCopy.identityStatusLabel}</span>
            <strong>{identityStateLabel(identity?.state ?? 'draft')}</strong>
          </Surface>
        </div>

        <div className="ds-section-stack">
          <FormField htmlFor="bio" label={creatorIdentityCopy.bioLabel}>
            <Textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} />
          </FormField>
        </div>

        <div className="ds-action-row ds-section-stack">
          <Button
            disabled={busy || displayName.trim().length === 0 || bio.trim().length === 0}
            onClick={() => void saveIdentity()}
            type="button"
          >
            {identity === null ? creatorIdentityCopy.saveNew : creatorIdentityCopy.saveChanges}
          </Button>
          <Button
            disabled={busy}
            onClick={() => void loadIdentity()}
            type="button"
            variant="outline"
          >
            {creatorIdentityCopy.reload}
          </Button>
        </div>

        <section className="ds-section-divider" aria-labelledby="service-section-title">
          <h2 className="ds-heading-section" id="service-section-title">
            {creatorIdentityCopy.serviceSectionTitle}
          </h2>
          {identity?.capabilities.length === 0 ? (
            <EmptyState>{creatorIdentityCopy.serviceEmpty}</EmptyState>
          ) : null}
          <div className="ds-item-stack">
            {identity?.capabilities.map((capability) => (
              <Surface className="ds-list-item" key={capability.id} tone="subtle">
                <p className="ds-list-item__title">{capability.name}</p>
                <p className="ds-list-item__description">{capability.description}</p>
              </Surface>
            ))}
          </div>
          <div className="ds-form-grid ds-section-stack">
            <FormField htmlFor="capability-name" label={creatorIdentityCopy.serviceNameLabel}>
              <Input
                id="capability-name"
                placeholder={creatorIdentityCopy.serviceNamePlaceholder}
                value={capabilityName}
                onChange={(event) => setCapabilityName(event.target.value)}
              />
            </FormField>
            <FormField
              htmlFor="capability-description"
              label={creatorIdentityCopy.serviceDescriptionLabel}
            >
              <Input
                id="capability-description"
                placeholder={creatorIdentityCopy.serviceDescriptionPlaceholder}
                value={capabilityDescription}
                onChange={(event) => setCapabilityDescription(event.target.value)}
              />
            </FormField>
          </div>
          <Button
            disabled={
              busy ||
              identity === null ||
              capabilityName.trim().length === 0 ||
              capabilityDescription.trim().length === 0
            }
            onClick={() => void addCapability()}
            type="button"
            variant="outline"
          >
            {creatorIdentityCopy.addService}
          </Button>
        </section>

        <section className="ds-section-divider" aria-labelledby="request-section-title">
          <h2 className="ds-heading-section" id="request-section-title">
            {creatorIdentityCopy.requestSectionTitle}
          </h2>
          {requests.length === 0 ? (
            <EmptyState>{creatorIdentityCopy.requestEmpty}</EmptyState>
          ) : null}
          <div className="ds-item-stack">
            {requests.map((request) => (
              <Surface className="ds-list-item" key={request.action.id} tone="subtle">
                <p className="ds-list-item__title">
                  {creatorIdentityCopy.requestOfferingLabel}
                  {request.offering.title}
                </p>
                <p className="ds-list-item__description">
                  {creatorIdentityCopy.requestCustomerLabel}
                  {request.customer.contactName}
                </p>
                <p className="ds-list-item__description">
                  {creatorIdentityCopy.requestContactLabel}
                  {request.customer.contactMethod}
                </p>
                <p className="ds-list-item__description">
                  {creatorIdentityCopy.requestMessageLabel}
                  {request.action.requestMessage}
                </p>
                <div className="ds-action-row ds-section-stack">
                  <Button
                    disabled={busy}
                    onClick={() => void decideRequest(request.action.id, 'confirm')}
                    type="button"
                  >
                    {creatorIdentityCopy.requestConfirm}
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() => void decideRequest(request.action.id, 'decline')}
                    type="button"
                    variant="outline"
                  >
                    {creatorIdentityCopy.requestDecline}
                  </Button>
                </div>
              </Surface>
            ))}
          </div>
        </section>

        <section className="ds-section-divider" aria-labelledby="offering-section-title">
          <h2 className="ds-heading-section" id="offering-section-title">
            {creatorIdentityCopy.offeringSectionTitle}
          </h2>
          {offerings.length === 0 ? (
            <EmptyState>{creatorIdentityCopy.offeringEmpty}</EmptyState>
          ) : null}
          <div className="ds-item-stack">
            {offerings.map((offering) => (
              <Surface className="ds-list-item" key={offering.id} tone="subtle">
                <p className="ds-list-item__title">
                  {offering.title || creatorIdentityCopy.offeringUntitled}
                </p>
                <p className="ds-list-item__description">
                  {creatorIdentityCopy.offeringStateLabel}
                  {offeringStateLabel(offering.state)}
                </p>
                {offering.missingPublishConditions.length > 0 ? (
                  <p className="ds-list-item__description">
                    {creatorIdentityCopy.offeringMissingConditions}
                    {missingPublishConditionLabels(offering.missingPublishConditions).join('、')}
                  </p>
                ) : null}
                {offering.state === 'draft' || offering.state === 'unpublished' ? (
                  <Button
                    disabled={busy || offering.missingPublishConditions.length > 0}
                    onClick={() => void publishOffering(offering.id)}
                    size="default"
                    type="button"
                  >
                    {creatorIdentityCopy.offeringPublish}
                  </Button>
                ) : null}
                {offering.state === 'published' ? (
                  <Button
                    disabled={busy}
                    onClick={() => void unpublishOffering(offering.id)}
                    size="default"
                    type="button"
                    variant="outline"
                  >
                    {creatorIdentityCopy.offeringUnpublish}
                  </Button>
                ) : null}
                {distributionAssets[offering.id] === undefined ? null : (
                  <div className="ds-section-stack">
                    <p className="ds-list-item__description">
                      {creatorIdentityCopy.offeringShareLabel}
                    </p>
                    <a
                      href={distributionAssets[offering.id].publicUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {distributionAssets[offering.id].publicUrl}
                    </a>
                    <p className="ds-list-item__description">
                      {distributionAssets[offering.id].state === 'distributed'
                        ? creatorIdentityCopy.offeringAssetDistributed
                        : creatorIdentityCopy.offeringAssetGenerated}
                    </p>
                    <Button
                      disabled={busy}
                      onClick={() => void copyShareUrl(distributionAssets[offering.id].publicUrl)}
                      size="default"
                      type="button"
                      variant="outline"
                    >
                      {creatorIdentityCopy.offeringCopyShare}
                    </Button>
                  </div>
                )}
                {offering.state === 'published' ? (
                  <Button
                    disabled={busy}
                    onClick={() => void recordExternalDistribution(offering.id)}
                    size="default"
                    type="button"
                    variant="outline"
                  >
                    {creatorIdentityCopy.offeringRecordDistribution}
                  </Button>
                ) : null}
                <Button
                  onClick={() => editOffering(offering)}
                  size="default"
                  type="button"
                  variant="outline"
                >
                  {creatorIdentityCopy.offeringSaveChanges}
                </Button>
              </Surface>
            ))}
          </div>

          <div className="ds-form-grid ds-section-stack">
            <FormField htmlFor="offering-title" label={creatorIdentityCopy.offeringTitleLabel}>
              <Input
                id="offering-title"
                placeholder={creatorIdentityCopy.offeringTitlePlaceholder}
                value={offeringTitle}
                onChange={(event) => setOfferingTitle(event.target.value)}
              />
            </FormField>
            <FormField
              htmlFor="offering-capability"
              label={creatorIdentityCopy.offeringServiceLabel}
            >
              <select
                className="ds-input"
                id="offering-capability"
                value={selectedCapabilityId}
                onChange={(event) => setSelectedCapabilityId(event.target.value)}
              >
                <option value="">{creatorIdentityCopy.offeringServiceEmpty}</option>
                {identity?.capabilities.map((capability) => (
                  <option key={capability.id} value={capability.id}>
                    {capability.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="ds-section-stack">
            <FormField
              htmlFor="offering-description"
              label={creatorIdentityCopy.offeringDescriptionLabel}
            >
              <Textarea
                id="offering-description"
                placeholder={creatorIdentityCopy.offeringDescriptionPlaceholder}
                value={offeringDescription}
                onChange={(event) => setOfferingDescription(event.target.value)}
              />
            </FormField>
          </div>
          <div className="ds-form-grid ds-section-stack">
            <FormField
              htmlFor="offering-availability"
              label={creatorIdentityCopy.offeringAvailabilityLabel}
            >
              <Input
                id="offering-availability"
                placeholder={creatorIdentityCopy.offeringAvailabilityPlaceholder}
                value={availabilityDescription}
                onChange={(event) => setAvailabilityDescription(event.target.value)}
              />
            </FormField>
            <FormField
              htmlFor="offering-request-instructions"
              label={creatorIdentityCopy.offeringRequestInstructionsLabel}
            >
              <Input
                id="offering-request-instructions"
                placeholder={creatorIdentityCopy.offeringRequestInstructionsPlaceholder}
                value={requestInstructions}
                onChange={(event) => setRequestInstructions(event.target.value)}
              />
            </FormField>
          </div>
          <div className="ds-action-row ds-section-stack">
            <Button
              disabled={busy || identity === null}
              onClick={() => void saveOffering()}
              type="button"
            >
              {editingOfferingId === null
                ? creatorIdentityCopy.offeringSaveNew
                : creatorIdentityCopy.offeringSaveChanges}
            </Button>
            {editingOfferingId === null ? null : (
              <Button disabled={busy} onClick={resetOfferingForm} type="button" variant="outline">
                {creatorIdentityCopy.offeringSaveNew}
              </Button>
            )}
          </div>
        </section>
      </Surface>
    </main>
  );
}
