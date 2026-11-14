import Link from 'next/link';
import { sections } from '../lib/sections';

export default function Overview() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Operations / Overview</p>
        <h1>运营工作台</h1>
        <p>统一查看目录、服务政策与运营记录。</p>
      </div>
      <section className="notice" aria-label="当前开放范围">
        <span className="availability">内部只读能力已开放</span>
        <h2>Catalog 与 Audit 已接入</h2>
        <p>当前版本通过 Operations Session 查询真实 Catalog 与 Audit 数据，不提供业务写操作。</p>
      </section>
      <div className="section-heading">
        <h2>工作区域</h2>
        <span>待实施</span>
      </div>
      <div className="section-grid">
        {sections
          .filter((section) => section.slug)
          .map((section) => (
            <Link className="section-card" key={section.slug} href={'/' + section.slug}>
              <span className="card-label">
                {section.english}
                <span aria-hidden="true">↗</span>
              </span>
              <h3>{section.label}</h3>
              <p>{section.description}</p>
              <span className="card-status">只读</span>
            </Link>
          ))}
      </div>
    </>
  );
}
