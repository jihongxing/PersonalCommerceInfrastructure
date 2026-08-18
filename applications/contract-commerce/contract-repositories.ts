import type {
  ContractAcceptanceFact,
  Contract,
  ContractScopeVersion,
} from '../../modules/contract-commerce/contract.js';

export interface ContractRepository {
  findById(id: string): Promise<Contract | undefined>;
  findByCommerceActionId(commerceActionId: string): Promise<Contract | undefined>;
  findByResultAccessToken(resultAccessToken: string): Promise<Contract | undefined>;
  findByCreatorId(creatorId: string): Promise<readonly Contract[]>;
  save(contract: Contract): Promise<void>;
  lock(contractId: string): Promise<void>;
}

export interface ContractScopeVersionRepository {
  findVersionById(id: string): Promise<ContractScopeVersion | undefined>;
  listByContractId(contractId: string): Promise<readonly ContractScopeVersion[]>;
  append(version: ContractScopeVersion): Promise<void>;
}

export interface ContractAcceptanceFactRepository {
  listAcceptanceFactsByContractId(contractId: string): Promise<readonly ContractAcceptanceFact[]>;
  appendAcceptanceFact(fact: ContractAcceptanceFact): Promise<void>;
}
