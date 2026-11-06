import { describe, expect, it } from 'vitest';

import {
  markTransactional,
  isMethodTransactional,
  getTransactionMetadata,
  validateTransactionAnnotations,
} from './transaction-boundary.js';

describe('Transaction Boundary', () => {
  describe('markTransactional', () => {
    it('marks method as transactional', () => {
      class TestUseCase {
        public async execute(): Promise<void> {
          markTransactional(this, 'execute');
        }
      }

      const useCase = new TestUseCase();
      void useCase.execute();
      
      expect(isMethodTransactional(useCase, 'execute')).toBe(true);
    });

    it('stores transaction options', () => {
      class TestUseCase {
        public async execute(): Promise<void> {
          markTransactional(this, 'execute', {
            description: 'Ensures atomic withdrawal',
            isolationLevel: 'READ_COMMITTED',
            readOnly: false,
          });
        }
      }

      const useCase = new TestUseCase();
      void useCase.execute();

      const metadata = getTransactionMetadata(useCase, 'execute');

      expect(metadata).toEqual({
        description: 'Ensures atomic withdrawal',
        isolationLevel: 'READ_COMMITTED',
        readOnly: false,
      });
    });

    it('defaults to empty options when not provided', () => {
      class TestUseCase {
        public async execute(): Promise<void> {
          markTransactional(this, 'execute');
        }
      }

      const useCase = new TestUseCase();
      void useCase.execute();

      const metadata = getTransactionMetadata(useCase, 'execute');

      expect(metadata).toEqual({});
    });
  });

  describe('isMethodTransactional', () => {
    it('returns true for marked methods', () => {
      class TestUseCase {
        public async execute(): Promise<void> {
          markTransactional(this, 'execute');
        }
      }

      const useCase = new TestUseCase();
      void useCase.execute();
      
      expect(isMethodTransactional(useCase, 'execute')).toBe(true);
    });

    it('returns false for unmarked methods', () => {
      class TestUseCase {
        public async execute(): Promise<void> {}
      }

      const useCase = new TestUseCase();
      expect(isMethodTransactional(useCase, 'execute')).toBe(false);
    });

    it('returns false for non-object targets', () => {
      expect(isMethodTransactional(null, 'execute')).toBe(false);
      expect(isMethodTransactional(undefined, 'execute')).toBe(false);
    });
  });

  describe('getTransactionMetadata', () => {
    it('returns metadata for marked methods', () => {
      class TestUseCase {
        public async execute(): Promise<void> {
          markTransactional(this, 'execute', {
            description: 'Test transaction',
            readOnly: true,
          });
        }
      }

      const useCase = new TestUseCase();
      void useCase.execute();

      const metadata = getTransactionMetadata(useCase, 'execute');

      expect(metadata).toEqual({
        description: 'Test transaction',
        readOnly: true,
      });
    });

    it('returns null for unmarked methods', () => {
      class TestUseCase {
        public async execute(): Promise<void> {}
      }

      const useCase = new TestUseCase();
      const metadata = getTransactionMetadata(useCase, 'execute');

      expect(metadata).toBeNull();
    });
  });

  describe('validateTransactionAnnotations', () => {
    it('returns empty array when all use cases are marked', () => {
      class UseCase1 {
        public async execute(): Promise<void> {
          markTransactional(this, 'execute');
        }
      }

      class UseCase2 {
        public async execute(): Promise<void> {
          markTransactional(this, 'execute');
        }
      }

      const uc1 = new UseCase1();
      const uc2 = new UseCase2();
      void uc1.execute();
      void uc2.execute();

      const useCases = {
        useCase1: uc1,
        useCase2: uc2,
      };

      const missing = validateTransactionAnnotations(useCases, 'execute');
      expect(missing).toEqual([]);
    });

    it('returns names of use cases missing annotations', () => {
      class UseCase1 {
        public async execute(): Promise<void> {
          markTransactional(this, 'execute');
        }
      }

      class UseCase2 {
        public async execute(): Promise<void> {}
      }

      const uc1 = new UseCase1();
      void uc1.execute();

      const useCases = {
        useCase1: uc1,
        useCase2: new UseCase2(),
      };

      const missing = validateTransactionAnnotations(useCases, 'execute');
      expect(missing).toEqual(['useCase2']);
    });
  });
});
