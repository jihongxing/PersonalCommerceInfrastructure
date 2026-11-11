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
        <p>当前仅提供导航与页面框架。身份验证尚未接入，工作台不加载运营数据，也不提供管理操作。</p>
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
              <span className="card-status">尚未开放</span>
            </Link>
          ))}
      </div>
    </>
  );
}
