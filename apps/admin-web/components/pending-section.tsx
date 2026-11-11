export function PendingSection({ title, description }: { title: string; description: string }) {
  return (
    <section className="empty-state" aria-label={title}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="7" y="9" width="26" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 9V6h12v3M14 18h12M14 24h8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className="availability">待实施 · 暂不可用</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <p className="muted">身份验证与权限接入完成后，才会开放数据查询及管理操作。</p>
    </section>
  );
}
