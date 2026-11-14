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
        <span className="availability">基础框架已建立</span>
        <h2>运营功能尚未开放</h2>
        <p>
          当前版本已接入 Operations Session。Catalog 与 Audit 真实数据页面将在后续有界单元中开放。
        </p>
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
              <span className="card-status">准备中</span>
            </Link>
          ))}
      </div>
    </>
  );
}
