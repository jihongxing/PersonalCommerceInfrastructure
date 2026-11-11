import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="empty-state">
      <h1>找不到此工作区域</h1>
      <p>请从导航选择已有区域。</p>
      <Link href="/">返回概览</Link>
    </section>
  );
}
