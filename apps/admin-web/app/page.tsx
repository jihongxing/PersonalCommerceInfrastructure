import { WorkspaceOverview } from '../components/workspace-overview';

export default function Overview() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Operations / Overview</p>
        <h1>运营工作台</h1>
        <p>掌握平台供给与请求状态，检索真实业务记录。</p>
      </div>
      <WorkspaceOverview />
    </>
  );
}
