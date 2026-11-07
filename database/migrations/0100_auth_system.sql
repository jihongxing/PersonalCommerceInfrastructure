-- ========================================================================
-- 认证系统数据库迁移
-- ========================================================================
-- 
-- 创建以下表:
--   1. accounts - 用户账户表
--   2. refresh_tokens - 刷新令牌表
--   3. password_resets - 密码重置表

-- ========================================================================
-- 1. 创建 accounts 表
-- ========================================================================

CREATE TABLE "accounts" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "name" varchar(120),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_login_at" timestamp with time zone
);

-- 创建索引用于快速查询
CREATE INDEX "accounts_email_idx" ON "accounts" USING btree ("email");
CREATE INDEX "accounts_created_at_idx" ON "accounts" USING btree ("created_at");
CREATE INDEX "accounts_is_active_idx" ON "accounts" USING btree ("is_active");

-- ========================================================================
-- 2. 创建 refresh_tokens 表
-- ========================================================================

CREATE TABLE "refresh_tokens" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "account_id" varchar(36) NOT NULL,
  "token_hash" varchar(255) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "is_revoked" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone,
  CONSTRAINT "refresh_tokens_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX "refresh_tokens_account_id_idx" ON "refresh_tokens" USING btree ("account_id");
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");
CREATE INDEX "refresh_tokens_is_revoked_idx" ON "refresh_tokens" USING btree ("is_revoked");
CREATE INDEX "refresh_tokens_created_at_idx" ON "refresh_tokens" USING btree ("created_at");

-- ========================================================================
-- 3. 创建 password_resets 表
-- ========================================================================

CREATE TABLE "password_resets" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL,
  "token_hash" varchar(255) NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "is_used" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "used_at" timestamp with time zone
);

-- 创建索引
CREATE INDEX "password_resets_email_idx" ON "password_resets" USING btree ("email");
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets" USING btree ("expires_at");
CREATE INDEX "password_resets_is_used_idx" ON "password_resets" USING btree ("is_used");
CREATE INDEX "password_resets_created_at_idx" ON "password_resets" USING btree ("created_at");

-- ========================================================================
-- 4. 创建自动更新时间戳的触发器（accounts 表）
-- ========================================================================

CREATE OR REPLACE FUNCTION "update_accounts_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "accounts_updated_at_trigger"
BEFORE UPDATE ON "accounts"
FOR EACH ROW
EXECUTE FUNCTION "update_accounts_updated_at"();

