import { OperationsExceptionsInbox } from '../../../components/operations-exceptions-inbox';

export default function OperationsExceptionsPage() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">Operations / Evidence Exceptions</p>
        <h1>运营异常发现</h1>
        <p>从现有 Catalog、Offering、Request 和 Audit 证据中识别可解释的关注信号。</p>
      </div>
      <OperationsExceptionsInbox />
    </>
  );
}
