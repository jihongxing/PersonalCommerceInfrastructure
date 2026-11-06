const transactionMetadata = new WeakMap<object, Map<string, TransactionOptions>>();

export interface TransactionOptions {
  description?: string;
  isolationLevel?: string;
  readOnly?: boolean;
}

export function markTransactional(
  target: object,
  methodName: string,
  options?: TransactionOptions,
): void {
  let methods = transactionMetadata.get(target);
  if (!methods) {
    methods = new Map();
    transactionMetadata.set(target, methods);
  }
  methods.set(methodName, options || {});
}

export function isMethodTransactional(target: unknown, methodName: string): boolean {
  if (!target || typeof target !== 'object') return false;
  const methods = transactionMetadata.get(target);
  return methods?.has(methodName) ?? false;
}

export function getTransactionMetadata(target: unknown, methodName: string): TransactionOptions | null {
  if (!target || typeof target !== 'object') return null;
  const methods = transactionMetadata.get(target);
  return methods?.get(methodName) ?? null;
}

export type TransactionScope<T> = (scope: { [key: string]: unknown }) => Promise<T>;

export function validateTransactionAnnotations(useCases: Record<string, unknown>, methodName: string): string[] {
  const missing: string[] = [];
  for (const [name, useCase] of Object.entries(useCases)) {
    if (!isMethodTransactional(useCase, methodName)) {
      missing.push(name);
    }
  }
  return missing;
}
