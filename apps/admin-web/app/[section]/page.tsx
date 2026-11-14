import { notFound } from 'next/navigation';
import { PendingSection } from '../../components/pending-section';
import { CatalogReadPanel } from '../../components/catalog-read-panel';
import { AuditReadPanel } from '../../components/audit-read-panel';
import { sections } from '../../lib/sections';

export function generateStaticParams() {
  return sections.filter((section) => section.slug).map((section) => ({ section: section.slug }));
}

export const dynamicParams = false;

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: slug } = await params;
  const section = sections.find((entry) => entry.slug === slug && entry.slug !== '');
  if (!section) notFound();
  if (slug === 'capabilities' || slug === 'templates') {
    return (
      <>
        <div className="page-heading">
          <p className="eyebrow">Operations / {section.english}</p>
          <h1>{section.label}</h1>
          <p>{section.description}</p>
        </div>
        <CatalogReadPanel kind={slug} />
      </>
    );
  }
  if (slug === 'audit') {
    return (
      <>
        <div className="page-heading">
          <p className="eyebrow">Operations / {section.english}</p>
          <h1>{section.label}</h1>
          <p>{section.description}</p>
        </div>
        <AuditReadPanel />
      </>
    );
  }
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Operations / {section.english}</p>
        <h1>{section.label}</h1>
        <p>{section.description}</p>
      </div>
      <PendingSection
        title={section.label + '尚未开放'}
        description="此区域暂未接入运营数据与处理流程。"
      />
    </>
  );
}
