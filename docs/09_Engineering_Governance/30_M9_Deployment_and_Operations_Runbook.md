# 30 — M9 Deployment and Operations Runbook

> **Status**：Implementation  
> **Scope**：VS-01 Deployable Prototype Hardening  
> **Product Behavior**：No change

本页保留 M9 历史部署合同，使用旧 Web 和旧认证配置；它不是当前 Web V2 / 本地 JWT
部署指南。历史 Compose 依赖的 API Dockerfile 已更新，其命令未验证且不能视为可运行部署。
当前入口及限制见 `112_Request_Tracing_Operations.md`。

## 1. Build

```powershell
podman build -f deploy/Dockerfile.api -t personal-commerce-api:0.2.0 .
podman build `
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3000 `
  -f deploy/Dockerfile.web `
  -t personal-commerce-web:0.2.0 .
```

镜像构建不得注入运行时 Secret。`NEXT_PUBLIC_API_BASE_URL` 是公开客户端配置，不属于 Secret。

## 2. Production-like Startup

```powershell
Copy-Item deploy/.env.m9-legacy.example deploy/.env.m9-legacy
podman compose --env-file deploy/.env.m9-legacy -f deploy/compose.m9-legacy.yml up --build
```

启动顺序固定为：

```text
PostgreSQL Ready
→ Migration Job Complete
→ API Readiness
→ Web Start
```

应用实例不得执行隐式 Schema Push。所有 Schema 变化必须先由独立 Migration Job 完成。

## 3. Smoke

以下命令和入口描述为历史记录。当前 `smoke:deployment` 与部署演练已切换至 Web V2
和本地 JWT；当前命令、端口和验证范围见 `112_Request_Tracing_Operations.md` 的隔离部署演练。

```powershell
$env:SMOKE_API_BASE_URL = "http://127.0.0.1:3000"
$env:SMOKE_WEB_BASE_URL = "http://127.0.0.1:3001"
pnpm smoke:deployment
```

Smoke 验证 API Health、依赖 Readiness、OpenAPI 和 Web Reference Client 的关键入口，
包括 `/creator`、`/public`、`/customer` 和受控 `/operations` 入口。

完整 Production-like 演练：

```powershell
pnpm test:deployment
```

该命令验证 Migration Job、API/Web 镜像运行、Smoke、Backup/Restore 和 API 优雅关闭。

当产品负责人批准 localhost 作为阶段验收环境时，执行记录必须标注为
`local deployment acceptance`。本地验收不能改写为外部生产部署证据，也不能证明真实渠道
可达性、商业成功或 Creator 采用结果。

## 4. Backup

```powershell
./scripts/operations/backup-postgres.ps1 `
  -ContainerName personal-commerce-postgres `
  -OutputPath ./output/backups/personal-commerce.sql
```

备份文件属于受控运行资产，不得提交到 Git。

## 5. Restore

恢复必须写入新数据库或已确认可覆盖的受控目标。禁止在未确认目标数据库的情况下执行恢复。

```powershell
./scripts/operations/restore-postgres.ps1 `
  -ContainerName personal-commerce-postgres `
  -InputPath ./output/backups/personal-commerce.sql `
  -DatabaseName personal_commerce_restore
```

恢复后必须运行 Migration Check、Readiness 和 Deployment Smoke。

## 6. Application Rollback

数据库 Migration 默认只向前演进。应用回滚流程：

1. 保留当前数据库和已提交业务数据；
2. 将 API / Web 镜像切回上一已验证版本；
3. 运行 Readiness 和 Deployment Smoke；
4. 若旧应用与当前 Schema 不兼容，停止回滚并恢复新版本；
5. 不通过删除业务数据或回滚合法 Canonical Event 完成应用回滚。

当前 `test-production-deployment.ps1` 会以 `RollbackApiImage` 替换当前 API 容器，并在不恢复数据库
备份的前提下重新执行 Readiness、Smoke、登录和身份读取。默认镜像相同，只验证替换流程；
实际回退仍须使用经过验证的旧镜像检查 schema 兼容性。

## 7. Minimum Alerts

最低告警条件：

- API Health 连续失败；
- API Readiness 连续失败；
- Deployment Smoke 失败；
- Migration Job 非零退出；
- Backup Job 失败或超过预期时间未产生新备份；
- 日志出现 `api_start_failed`、`api_shutdown_failed` 或持续的 `unhandled_api_error`。

告警不得包含 Authorization、Contact、Result Token、数据库密码或 Provider Secret。

## 8. Secrets

- `DATABASE_URL`、数据库密码、Supabase Key 和 Actor Mapping 通过环境或 Secret Store 注入；
- `OPERATIONS_ACCESS_TOKEN` 与 `OPERATIONS_OPERATOR_ID` 只注入 API Runtime；前者至少
  16 个字符，不得进入客户端构建、日志、截图或 Git；
- 不写入镜像、Compose 文件、日志、截图或 Git；
- 日志必须继续遵守 Safe Logger 脱敏规则。

## 9. PCI-ENG-029 Isolated Full Recovery Validation

The existing plain-SQL `backup-postgres.ps1` and `restore-postgres.ps1` procedures do not include
cluster globals. For a complete isolated recovery drill, use the task-scoped scripts below. This
procedure was added under the 2026-11-21 PCI-ENG-029 authorization and is not a production
deployment authorization.

### 9.1 Prerequisites

- Use only a task-controlled non-production PostgreSQL 17 source and a separate clean target.
- Bind any temporary host port to loopback only; do not connect to production or shared databases.
- Generate task-local credentials at runtime and never commit them, the backup artifacts or resolved
  environment files.
- Provision the source with the existing database-installation contract: required restricted
  Operations roles and the `operations_api` / `operations_private` schemas must exist before
  migrations 0040+. The plain `db:migrate` command does not create those pristine-database
  prerequisites by itself.
- Confirm the target database name is new and includes `integration` when using the existing
  `db:integration:check` gate.

### 9.2 Full backup

```powershell
./scripts/operations/backup-postgres-full.ps1 `
  -ContainerName pci-eng-029-source `
  -OutputDirectory ./output/pci-eng-029/recovery `
  -DatabaseName personal_commerce_integration `
  -DatabaseAdminUser pci_eng029_source_admin
```

The output contains `database.dump` in PostgreSQL custom format, `globals.sql` from
`pg_dumpall --globals-only`, and `manifest.json` with SHA-256 hashes and non-secret database
metadata. The globals artifact is required for roles and role memberships; the custom dump retains
object ownership and database objects.

### 9.3 Clean-target restore

```powershell
./scripts/operations/restore-postgres-full.ps1 `
  -ContainerName pci-eng-029-target `
  -InputDirectory ./output/pci-eng-029/recovery `
  -DatabaseName personal_commerce_integration_restore `
  -DatabaseAdminUser pci_eng029_restore_admin
```

The restore refuses the source database name, verifies artifact hashes before copying, restores
globals before creating the target database, restores without `--no-owner`, reapplies captured
database ACL entries, and removes the target database on a failed attempt when it was created by
the script. Because PostgreSQL cluster-global role creation is not transactional with database
creation, retry a failed restore only against a fresh target container or after independently
removing any roles created by the failed globals step.

### 9.4 Post-restore verification

```powershell
./scripts/operations/verify-postgres-recovery.ps1 `
  -SourceContainerName pci-eng-029-source `
  -SourceDatabaseName personal_commerce_integration `
  -SourceDatabaseUser pci_eng029_source_admin `
  -TargetContainerName pci-eng-029-target `
  -TargetDatabaseName personal_commerce_integration_restore `
  -TargetDatabaseUser pci_eng029_restore_admin
```

The comparison covers PostgreSQL version, database owner and ACLs, extensions, role definitions
and password-presence metadata, role memberships, schema and relation owners/ACLs, function ACLs,
column structure, migration Journal rows and table row counts. The existing
`PCI_INTEGRATION_DATABASE=1 pnpm db:integration:check` gate and a direct connection as the
restricted runtime role are separate required checks; neither is implied by the comparison script.

### 9.5 Limitations

This procedure validates an isolated local recovery only. It does not verify production storage,
secret management, external backup durability, TLS, monitoring, RPO/RTO, a production cloud
provider, external Pilot or real-money operations. Failure of any check is recorded as `BLOCKED`,
not relabeled as `PASS`.
