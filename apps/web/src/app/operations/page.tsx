import { OperationsExternalFactWorkspace } from '../../components/operations-external-fact-workspace';
import { CommercialPilotOperationsWorkspace } from '../../components/commercial-pilot-operations-workspace';

export default function OperationsPage() {
  return (
    <>
      <CommercialPilotOperationsWorkspace />
      <OperationsExternalFactWorkspace />
    </>
  );
}
