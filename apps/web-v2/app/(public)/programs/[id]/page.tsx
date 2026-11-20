import { Suspense } from 'react';
import { ProgramJoin } from '@/features/program/program-client';

export default function PublicProgramRunPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p role="status">正在加载计划…</p>}>
      <ProgramDetail params={params} />
    </Suspense>
  );
}

async function ProgramDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProgramJoin runId={id} />;
}
