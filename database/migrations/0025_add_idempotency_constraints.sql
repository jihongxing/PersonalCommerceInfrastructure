-- Migration: Add idempotency constraints
-- Purpose: Ensure idempotency for financial operations (Withdrawal, Payment)
-- Date: 2026-11-06

-- Withdrawal 幂等性索引
-- 在 requested/completed 状态下，idempotency_key 必须唯一
CREATE UNIQUE INDEX idx_withdrawals_idempotency_key
ON paid_commerce_withdrawals(idempotency_key)
WHERE state IN ('requested', 'completed');

-- Payment 幂等性约束
-- correlation_id + order_id 组合必须唯一（一个订单的一个支付流程只能有一个支付记录）
ALTER TABLE paid_commerce_payments
ADD CONSTRAINT unique_payment_correlation_id
UNIQUE (correlation_id, order_id);
