import type {
  ContractAcceptanceFactRepository,
  ContractRepository,
  ContractScopeVersionRepository,
} from '../../applications/contract-commerce/contract-repositories.js';
import type {
  ContractAcceptanceFact,
  Contract,
  ContractScopeVersion,
} from '../../modules/contract-commerce/contract.js';

import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryContractRepository
  implements
    ContractRepository,
    ContractScopeVersionRepository,
    ContractAcceptanceFactRepository,
    TransactionParticipant
{
  private contracts = new Map<string, Contract>();
  private scopeVersions = new Map<string, ContractScopeVersion>();
  private acceptanceFacts = new Map<string, ContractAcceptanceFact>();

  public findById(id: string): Promise<Contract | undefined> {
    return Promise.resolve(clone(this.contracts.get(id)));
  }

  public findByCommerceActionId(commerceActionId: string): Promise<Contract | undefined> {
    return Promise.resolve(
      clone(
        [...this.contracts.values()].find(
          (contract) => contract.commerceActionId === commerceActionId,
        ),
      ),
    );
  }

  public findByResultAccessToken(resultAccessToken: string): Promise<Contract | undefined> {
    return Promise.resolve(
      clone(
        [...this.contracts.values()].find(
          (contract) => contract.resultAccessToken === resultAccessToken,
        ),
      ),
    );
  }

  public findByCreatorId(creatorId: string): Promise<readonly Contract[]> {
    return Promise.resolve(
      structuredClone(
        [...this.contracts.values()].filter((contract) => contract.creatorId === creatorId),
      ),
    );
  }

  public save(contract: Contract): Promise<void> {
    this.contracts.set(contract.id, structuredClone(contract));
    return Promise.resolve();
  }

  public lock(contractId: string): Promise<void> {
    void contractId;
    return Promise.resolve();
  }

  public findVersionById(id: string): Promise<ContractScopeVersion | undefined> {
    return Promise.resolve(clone(this.scopeVersions.get(id)));
  }

  public listByContractId(contractId: string): Promise<readonly ContractScopeVersion[]> {
    return Promise.resolve(
      structuredClone(
        [...this.scopeVersions.values()]
          .filter((version) => version.contractId === contractId)
          .sort((left, right) => left.version - right.version),
      ),
    );
  }

  public append(version: ContractScopeVersion): Promise<void> {
    if (
      this.scopeVersions.has(version.id) ||
      [...this.scopeVersions.values()].some(
        (existing) =>
          existing.contractId === version.contractId && existing.version === version.version,
      )
    ) {
      throw new Error(
        `Contract Scope Version ${version.contractId}:${version.version} is append-only.`,
      );
    }
    this.scopeVersions.set(version.id, structuredClone(version));
    return Promise.resolve();
  }

  public listAcceptanceFactsByContractId(
    contractId: string,
  ): Promise<readonly ContractAcceptanceFact[]> {
    return Promise.resolve(
      structuredClone(
        [...this.acceptanceFacts.values()].filter((fact) => fact.contractId === contractId),
      ),
    );
  }

  public appendAcceptanceFact(fact: ContractAcceptanceFact): Promise<void> {
    if (this.acceptanceFacts.has(fact.id)) {
      return Promise.resolve();
    }
    this.acceptanceFacts.set(fact.id, structuredClone(fact));
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return structuredClone({
      contracts: this.contracts,
      scopeVersions: this.scopeVersions,
      acceptanceFacts: this.acceptanceFacts,
    });
  }

  public restoreSnapshot(snapshot: unknown): void {
    const value = snapshot as {
      readonly contracts: Map<string, Contract>;
      readonly scopeVersions: Map<string, ContractScopeVersion>;
      readonly acceptanceFacts: Map<string, ContractAcceptanceFact>;
    };
    this.contracts = structuredClone(value.contracts);
    this.scopeVersions = structuredClone(value.scopeVersions);
    this.acceptanceFacts = structuredClone(value.acceptanceFacts);
  }
}

function clone<Value>(value: Value | undefined): Value | undefined {
  return value === undefined ? undefined : structuredClone(value);
}
