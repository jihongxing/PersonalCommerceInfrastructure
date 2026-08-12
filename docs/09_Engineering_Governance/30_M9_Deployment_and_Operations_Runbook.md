# 30 — M9 Deployment and Operations Runbook

> **Status**：Implementation  
> **Scope**：VS-01 Deployable Prototype Hardening  
> **Product Behavior**：No change

## 1. Build

```powershell
podman build -f deploy/Dockerfile.api -t personal-commerce-api:0.1.0 .
podman build `
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3000 `
  -f deploy/Dockerfile.web `
  -t personal-commerce-web:0.1.0 .
```

镜像构建不得注入运行时 Secret。`NEXT_PUBLIC_API_BASE_URL` 是公开客户端配置，不属于 Secret。

## 2. Production-like Startup

```powershell
Copy-Item deploy/.env.production.example deploy/.env.production
podman compose --env-file deploy/.env.production -f deploy/compose.production.yml up --build
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

```powershell
$env:SMOKE_API_BASE_URL = "http://127.0.0.1:3000"
$env:SMOKE_WEB_BASE_URL = "http://127.0.0.1:3001"
pnpm smoke:deployment
```

Smoke 验证 API Health、依赖 Readiness、OpenAPI 和 Web Reference Client 的关键入口。

完整 Production-like 演练：

```powershell
pnpm test:deployment
```

该命令验证 Migration Job、API/Web 镜像运行、Smoke、Backup/Restore 和 API 优雅关闭。

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

`test-production-deployment.ps1` 会以 `RollbackApiImage` 替换当前 API 容器，并在不恢复数据库
备份的前提下重新执行 Readiness 与 Smoke，用于验证应用层回滚路径。

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
- 不写入镜像、Compose 文件、日志、截图或 Git；
- 日志必须继续遵守 Safe Logger 脱敏规则。
