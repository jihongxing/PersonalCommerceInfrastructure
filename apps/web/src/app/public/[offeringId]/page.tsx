import type { Metadata } from 'next';

import { PublicOfferingWorkspace } from '@/components/public-offering-workspace';
import { loadWebConfiguration } from '@/configuration/bootstrap';
import { createApiClient } from '@/lib/api/client';

interface PublicOfferingPageProps {
  readonly params: Promise<{ readonly offeringId: string }>;
}

async function loadPublicOffering(offeringId: string) {
  const client = createApiClient({ apiBaseUrl: loadWebConfiguration().apiBaseUrl });
  const response = await client.GET('/api/v1/public/offerings/{offeringId}', {
    params: { path: { offeringId } },
  });
  return response.error === undefined ? response.data : null;
}

export async function generateMetadata({ params }: PublicOfferingPageProps): Promise<Metadata> {
  const { offeringId } = await params;

  try {
    const details = await loadPublicOffering(offeringId);

    if (details === null) {
      return {
        title: '公开服务 | Personal Commerce',
        description: '这项公开服务当前不可访问。',
        robots: { index: false, follow: false },
      };
    }

    return {
      title: `${details.offering.title} | ${details.creator.displayName}`,
      description: details.offering.description,
      openGraph: {
        title: `${details.offering.title} | ${details.creator.displayName}`,
        description: details.offering.description,
        type: 'website',
      },
    };
  } catch {
    return {
      title: '公开服务 | Personal Commerce',
      description: '这项公开服务当前不可访问。',
      robots: { index: false, follow: false },
    };
  }
}

export default async function PublicOfferingPage({ params }: PublicOfferingPageProps) {
  const { offeringId } = await params;
  return <PublicOfferingWorkspace offeringId={offeringId} />;
}
