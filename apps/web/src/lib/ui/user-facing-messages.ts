import { creatorIdentityCopy } from '../../content/user-facing-copy';
import { publicOfferingCopy } from '../../content/user-facing-copy';

interface ApiErrorLike {
  readonly error?: {
    readonly code?: string;
  };
}

export function toUserFacingMessage(error: ApiErrorLike, fallback: string): string {
  switch (error.error?.code) {
    case 'commerce_identity_not_found':
      return creatorIdentityCopy.identityMissing;
    case 'commerce_identity_already_exists':
      return '你的商业主页已经存在，请刷新页面后继续。';
    case 'creator_actor_required':
    case 'missing_auth_context':
      return '当前账号无法进行此操作，请先登录创作者账号。';
    case 'service_offering_not_found':
      return creatorIdentityCopy.offeringNotFound;
    case 'service_offering_not_owned':
      return creatorIdentityCopy.offeringNotOwned;
    case 'service_offering_capability_invalid':
      return creatorIdentityCopy.offeringServiceInvalid;
    case 'service_offering_publish_conditions_missing':
      return creatorIdentityCopy.offeringPublishFailed;
    case 'service_offering_not_published':
      return creatorIdentityCopy.offeringDistributionFailed;
    case 'service_offering_unavailable':
      return publicOfferingCopy.unavailable;
    case 'customer_request_information_missing':
      return publicOfferingCopy.submitFailed;
    case 'duplicate_unresolved_customer_request':
      return '你已经提交过这项服务请求，正在等待创作者处理。';
    default:
      return fallback;
  }
}

export function identityStateLabel(state: string): string {
  switch (state) {
    case 'draft':
      return creatorIdentityCopy.statusDraft;
    case 'published':
      return creatorIdentityCopy.statusPublished;
    case 'unpublished':
      return creatorIdentityCopy.statusUnpublished;
    default:
      return creatorIdentityCopy.statusDraft;
  }
}

export function offeringStateLabel(state: string): string {
  switch (state) {
    case 'draft':
      return creatorIdentityCopy.offeringStatusDraft;
    case 'published':
      return creatorIdentityCopy.offeringStatusPublished;
    case 'unpublished':
      return creatorIdentityCopy.offeringStatusUnpublished;
    default:
      return creatorIdentityCopy.offeringStatusDraft;
  }
}

export function missingPublishConditionLabels(conditions: readonly string[]): readonly string[] {
  const labelsByCondition: Record<string, string> = {
    title: creatorIdentityCopy.offeringMissingTitle,
    description: creatorIdentityCopy.offeringMissingDescription,
    capability: creatorIdentityCopy.offeringMissingCapability,
    availability: creatorIdentityCopy.offeringMissingAvailability,
    request_instructions: creatorIdentityCopy.offeringMissingRequestInstructions,
  };

  return conditions.map((condition) => labelsByCondition[condition] ?? condition);
}
