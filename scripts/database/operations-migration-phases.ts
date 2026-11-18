import { installationRoles } from './operations-migration-permissions.js';

const { table, function: functions, legacyFixture } = installationRoles;

export const activationHistoryRoles = [
  table,
  table,
  table,
  table,
  table,
  table,
  functions,
  functions,
  table,
  functions,
  functions,
  table,
  functions,
  table,
  functions,
  table,
  table,
  table,
  table,
  table,
  table,
  functions,
  functions,
  functions,
  functions,
  functions,
  functions,
] as const;

export const initialAdminRoles = [
  legacyFixture,
  table,
  functions,
  functions,
  legacyFixture,
  table,
] as const;
