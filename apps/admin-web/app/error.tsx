'use client';

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="empty-state" role="alert">
      <h1>暂时无法加载此区域</h1>
      <p>请重试。若问题持续，请联系工作台维护人员。</p>
      <button type="button" onClick={reset}>
        重新加载
      </button>
    </section>
  );
}
