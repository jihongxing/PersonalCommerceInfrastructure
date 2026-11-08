# 请求追踪本地运行手册

本手册针对 `apps/api`、`apps/web-v2` 和 Podman。采集配置使用本机绑定的 Collector
0.112.0 与 Jaeger all-in-one 1.62.0；Jaeger 使用内存存储，重启后数据消失。镜像来自
`docker.m.daocloud.io`；上游项目及 OpenTelemetry JS 依赖使用 Apache-2.0 许可。
本配置没有查询认证、持久化、备份或生产保留策略，不能部署到公网或视为生产方案。

## 启动

在仓库根目录执行：

```powershell
podman compose -p pci-tracing -f deploy/compose.observability.local.yml up -d
```

在启动 `apps/api` 的环境中设置 `OTEL_TRACING_ENABLED=true`；本地 100% 采样使用
`OTEL_TRACES_SAMPLER_ARG=1`。默认导出到 `http://127.0.0.1:4318/v1/traces`。
当前 exporter 仅支持 `http/json`；`OTEL_EXPORTER_OTLP_TRACES_PROTOCOL` 优先于通用的
`OTEL_EXPORTER_OTLP_PROTOCOL`，两者均未设置时默认 `http/json`。服务端或浏览器采集启用时，
配置其他协议会使 API 启动失败，防止静默使用错误协议；两个采集开关关闭时不检查未使用的协议。
启用浏览器追踪还需要 API 的 `OTEL_BROWSER_TRACING_ENABLED=true` 和 Web 构建/启动时的
`NEXT_PUBLIC_OTEL_BROWSER_TRACING_ENABLED=true`。两侧默认均关闭。配置
`WEB_REFERENCE_CLIENT_ORIGIN` 为实际 Web 来源，Web 的 `NEXT_PUBLIC_API_BASE_URL` 指向
正式 `apps/api`。修改环境变量后须重新启动对应进程；Next.js 公共变量在构建时注入。
正常业务端口仍为 Web 3000、API 8080；启动前确认端口归属，勿覆盖已有进程或数据库。

升级含 `auth.refresh.wait` 的浏览器追踪时，先将所有接收浏览器遥测的 API 实例升级到支持
该内部 span 的版本，验证接收后再发布 Web；旧接收端会拒绝包含该 span 的整个批次。
回滚时应先回滚 Web，并在旧页面及缓存客户端更新完成前保留兼容的 API 接收端；否则这些
客户端的遥测批次会被拒绝。该顺序不替代实际部署环境的发布和回滚验证。

浏览器共享会话刷新最多等待 15 秒，包括读取响应体。单个业务请求取消时仅结束该请求的
等待，不会中断其他请求共用的刷新；刷新超时返回网络错误，不主动清除会话。由于刷新令牌
会轮换，服务端可能已经消费旧令牌而浏览器没有收到新令牌，此时后续刷新可能被拒绝并需要
重新登录。超时后到达的响应不会覆盖当前会话；该限制不保证已消费的令牌仍可使用。

访问 `http://127.0.0.1:16686`，选择 `pci-api` 或 `pci-web` 查询。API 日志中的
`trace_id` 可用于查询已采样链路；未找到可能是未采样、导出失败、存储重启或保留过期，
不表示业务失败。`correlationId` 保留原有独立含义。`/health` 和 `/api/v1/readiness`
不是追踪查询接口。Collector 自身指标只绑定 `127.0.0.1:8888`。

API 入口保留合法 W3C `traceparent` 的 trace ID、父 span ID 和采样标志，但丢弃外部
`tracestate` 与 `baggage`，防止不可信调用者将任意数据写入追踪存储。因此依赖
`tracestate` 传递厂商状态的跨服务集成不能直接继承该状态；接入可信内部调用方之前需
另行设计可验证的信任边界及字段策略。服务端采样仍由本服务配置决定。

## 当前调用边界

- `apps/web-v2/lib/api/client.ts` 发起业务请求和会话刷新；浏览器追踪导出由
  `lib/api/tracing.ts` 发起。`lib/api/interceptor.ts` 的备用全局拦截器当前没有生产
  调用方，也没有纳入追踪；启用前须统一刷新逻辑并验证传播、并发和脱敏。
- `apps/api` 使用 `LogNotificationAdapter`，通知只写本地日志。正式 PostgreSQL
  组合在非生产环境使用 `LocalCommerceSimulator`，Webhook 使用拒绝式验签器和事件
  规范化器。仓库中的微信支付适配器依赖注入的 sandbox transport，当前未装配到
  `apps/api`。这些代码不证明真实通知、支付或第三方回调已经接入或完成追踪。
- 当前正式 API 源码中的显式 HTTP 出站是浏览器遥测接收器向配置的 Collector 转发；
  SDK 另行导出服务端遥测。这些采集请求不作为业务外部调用链路覆盖。

未来接入真实 HTTP 提供方时，应在该适配器上验证目标允许传播的 W3C 上下文、脱敏和
失败行为；禁止传播任意 baggage。真实异步任务或第三方回调应先持久化允许关联的上下文，
再根据实际关系使用父子关系或 span link，并通过真实集成测试验证，不能仅凭端口接口
或本地模拟器宣称覆盖。

启动本地采集栈后，可运行以下隔离测试，检查实际 Collector 和 Jaeger 中的父子关系及
敏感测试标记；测试只接受本机 HTTP 采集和查询地址，不连接或修改业务数据库：

```powershell
$env:TRACING_OTLP_TEST_ENDPOINT='http://127.0.0.1:4318/v1/traces'
$env:TRACING_JAEGER_TEST_URL='http://127.0.0.1:16686'
pnpm exec vitest run tests/integration/tracing-collector-privacy.test.ts
```

## 隔离浏览器验收

以下示例使用独立测试数据库和 13000/18080 端口。先确认这些端口和容器名称没有被占用；
测试密钥和密码只用于此隔离环境。启动前先按上文启动 Collector 和 Jaeger。在仓库根目录的
PowerShell 中执行，并等待数据库就绪：

```powershell
podman run -d --name pci-tracing-acceptance-db -p 127.0.0.1:45504:5432 -e POSTGRES_USER=tracing_test -e POSTGRES_PASSWORD=tracing_test -e POSTGRES_DB=tracing_test docker.m.daocloud.io/library/postgres:16
podman exec pci-tracing-acceptance-db pg_isready -U tracing_test -d tracing_test
$env:DATABASE_URL='postgresql://tracing_test:tracing_test@127.0.0.1:45504/tracing_test'
pnpm db:migrate
$env:APP_ENV='development'
$env:API_PORT='18080'
$env:WEB_REFERENCE_CLIENT_ORIGIN='http://localhost:13000'
$env:JWT_SECRET='tracing-browser-test-secret-32-bytes-long'
$env:OPERATIONS_ACCESS_TOKEN='tracing-test-operations-token'
$env:OPERATIONS_OPERATOR_ID='tracing-test-operator'
$env:OTEL_TRACING_ENABLED='true'
$env:OTEL_BROWSER_TRACING_ENABLED='true'
$env:OTEL_TRACES_SAMPLER_ARG='1'
pnpm dev:api
```

在另一个 PowerShell 中从 `apps/web-v2` 启动验收页面：

```powershell
pnpm exec vite --config e2e/tracing-harness/vite.config.ts
```

以上服务启动后，可在仓库根目录使用已安装的 gstack `/browse` 执行自动回归：

```powershell
$env:TRACING_BROWSE_EXECUTABLE='E:/Users/jihx/.codex/skills/gstack/browse/dist/browse.exe'
node scripts/operations/tracing-browser-acceptance.mjs
```

`TRACING_BROWSE_EXECUTABLE` 应指向当前机器实际安装的 browse 可执行文件。脚本新开并关闭
一个浏览器标签页，使用隔离测试账号，检查注册时浏览器、HTTP、认证和数据库 span 的父子关系，
并检查并发刷新、重试 links、拒绝刷新、取消及测试凭据脱敏。它查询本机 16686 端口的 Jaeger；
还会向结果访问路径和查询参数注入测试标记，检查实际浏览器导出和 Jaeger 中的路由脱敏。
脚本还验证两个等待者中取消一个、另一个正常重试，以及共享刷新读取响应体在 15 秒超时后
结束 span，并保留已收到的 HTTP 状态及错误标记。这两个场景通过测试页面延迟真实 API 的刷新
响应或响应体读取；并不模拟网络层丢包，也不能
证明所有浏览器关闭或网络中断情况下的遥测投递。
实际 Web 和 API 地址由上述验收页面固定为 13000/18080，切勿指向业务服务。测试通过后退出码为
0，失败时非零退出。该脚本使用复用正式 API 客户端的 Vite 页面，不代替 Next.js 页面或生产环境
验收；目前 GitHub Actions 不安装 gstack，也不会运行此脚本。

也可以使用同一隔离 API、数据库和采集栈验证真实 Next.js 注册页。在另一个 PowerShell 中
从 `apps/web-v2` 启动以下服务，确保 Vite 验收页没有占用 13000：

```powershell
$env:NEXT_PUBLIC_API_BASE_URL='http://localhost:18080'
$env:NEXT_PUBLIC_OTEL_BROWSER_TRACING_ENABLED='true'
$env:NEXT_DIST_DIR='.next-tracing-next-acceptance'
pnpm exec next dev --hostname 127.0.0.1 --port 13000
```

在仓库根目录设置前述 `TRACING_BROWSE_EXECUTABLE`，运行
`node scripts/operations/tracing-next-acceptance.mjs`。脚本在固定的测试来源
`http://localhost:13000` 清除 `pci.auth.session`，通过实际注册表单创建测试账号，检查工作台
邮箱、客户端导航、Jaeger 中注册链路的父子关系及测试凭据脱敏，并关闭测试标签页。该来源仅用于隔离测试；
不要在同一来源运行需要保留登录状态的应用。Next.js 可能自动修改 `tsconfig.json` 的类型目录，
测试后检查并移除本次临时目录对应的条目。此检查使用开发服务、真实 API 和临时数据库，
不代表生产构建、真实生产权限或所有浏览器的验收。

也可用生产构建的 Web 镜像执行相同脚本。先确认 13000 空闲并启动上文的隔离 API、数据库和
采集栈，然后在仓库根目录执行：

```powershell
podman build -f deploy/Dockerfile.web-v2 --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:18080 --build-arg NEXT_PUBLIC_OTEL_BROWSER_TRACING_ENABLED=true -t localhost/pci-tracing-web-v2-current-acceptance:local .
podman run -d --name pci-tracing-web-current-acceptance -p 127.0.0.1:13000:3000 localhost/pci-tracing-web-v2-current-acceptance:local
$env:TRACING_BROWSE_EXECUTABLE='E:/Users/jihx/.codex/skills/gstack/browse/dist/browse.exe'
node scripts/operations/tracing-next-acceptance.mjs
podman stop pci-tracing-web-current-acceptance
podman rm pci-tracing-web-current-acceptance
```

脚本中的来源和端口固定为隔离环境；镜像测试完成后仍须按上文停止独立 API、数据库和采集栈。
该检查不能替代生产部署及查询权限验收。

打开 `http://localhost:13000/e2e/tracing-harness/`，在浏览器控制台依次执行：

```javascript
await window.traceHarness.signup();
await window.traceHarness.concurrentExpired('tracing-browser-test-secret-32-bytes-long');
await window.traceHarness.cancelledRequest();
await window.traceHarness.pagehideFlush();
await window.traceHarness.rejectedRefresh();
window.traceHarness.exports();
```

并发测试预期两次 401、一次 refresh 200 和两次重试 200；根据返回的 traceparent 在
Jaeger 查看原请求、刷新、重试及其 links。工具人为延迟真实 refresh 响应 300 毫秒，
用于稳定制造并发等待；取消和拒绝测试会产生预期的浏览器错误日志。页面退出测试使用合成
`pagehide` 事件，不能代替所有浏览器及突然终止场景的交付保证。

每个等待共享刷新的请求还会产生一个 `auth.refresh.wait` 内部 span，分别链接原请求和共享
refresh，并以 `pci.refresh.outcome` 记录 `success`、`rejected` 或 `error`。可按服务
`pci-web` 和该操作名查询等待 span；它不是额外的 HTTP 请求。共享 refresh 本身的 links
导出上限为 16 个，等待 span 各自的两个 links 覆盖更多并发等待者。采样、队列丢弃或退出时
未能发送仍可能使任一 span 缺失，不能将这项关联视作可靠投递保证。

完成后停止两个测试进程，再清理本节创建的数据库和本地采集栈：

```powershell
podman stop pci-tracing-acceptance-db
podman rm pci-tracing-acceptance-db
podman compose -p pci-tracing -f deploy/compose.observability.local.yml down
```

不要将这些命令指向已有业务数据库或容器。

## 数据库故障验收

权限故障测试会创建并删除一个受限 PostgreSQL 角色，必须使用专用的本地测试数据库。
先确认 45505 端口和容器名称未被占用，在仓库根目录执行，等待数据库就绪后再迁移：

```powershell
podman run -d --name pci-tracing-db-fault -p 127.0.0.1:45505:5432 -e POSTGRES_USER=tracing_admin -e POSTGRES_PASSWORD=tracing_admin -e POSTGRES_DB=pci_tracing_disposable docker.m.daocloud.io/library/postgres:16
podman exec pci-tracing-db-fault pg_isready -U tracing_admin -d pci_tracing_disposable
$env:DATABASE_URL='postgresql://tracing_admin:tracing_admin@127.0.0.1:45505/pci_tracing_disposable'
pnpm db:migrate
$env:TRACING_DISPOSABLE_DATABASE_URL=$env:DATABASE_URL
$env:LOCAL_AUTH_TEST_DATABASE_URL=$env:DATABASE_URL
pnpm exec vitest run tests/integration/request-tracing.test.ts tests/integration/automatic-identity.integration.test.ts tests/integration/local-auth.integration.test.ts
pnpm exec vitest run tests/integration/tracing-disabled-startup.test.ts
```

测试要求本机地址、数据库名 `pci_tracing_disposable`，并使用具备创建角色权限的测试账号。
权限测试撤销临时角色的身份表写权限，检查真实 SQLSTATE、待补齐状态和错误追踪，恢复权限后
验证重试和身份绑定。网络测试使用本机 TCP 代理，在会话创建后关闭代理监听和现有连接，恢复后
验证同一会话的重试及身份绑定；它通过测试钩子控制故障时机，不代表生产网络或数据库宕机演练。
回退测试使用此数据库启动正式 API，关闭两侧采集后检查注册、登录、工作台初始化、身份读取、
健康、就绪及日志；它会在隔离数据库中创建测试账号，不应连接业务数据库。未设置
`TRACING_DISPOSABLE_DATABASE_URL` 时，数据库回退测试会跳过。
在同一个隔离数据库和本地采集栈均运行时，也可设置上节的 `TRACING_OTLP_TEST_ENDPOINT`、
`TRACING_JAEGER_TEST_URL`，并运行 `pnpm exec vitest run
tests/integration/tracing-collector-privacy.test.ts`。此时测试通过真实注册写入数据库，
在同一条 Jaeger trace 中检查认证、数据库和模拟浏览器 span，并检查测试敏感值没有进入查询结果
或 API 日志；它不代替真实浏览器遥测检查。该测试只接受本机且数据库名为
`pci_tracing_disposable` 的连接，不应指向现有业务数据库。
数据库连接关闭最多等待 5 秒，超时后驱动会终止剩余连接；关闭期间未完成的查询可能被中断。
结束后只清理此测试容器：

```powershell
podman stop pci-tracing-db-fault
podman rm pci-tracing-db-fault
```

## 隔离部署演练

以下命令从当前源码构建镜像，并在独立网络、临时 PostgreSQL 和本机 45200/45201 端口
验证部署。先确认端口未被占用；Web 的 API 地址在构建时固化，修改 `-ApiPort` 时也须修改
构建参数。命令使用测试凭据，不连接现有业务数据库：

```powershell
podman build -f deploy/Dockerfile.api -t personal-commerce-api:current .
podman build -f deploy/Dockerfile.web-v2 --build-arg NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:45200 -t personal-commerce-web-v2:current .
powershell.exe -File scripts/operations/test-production-deployment.ps1 -ContainerCli podman
```

演练检查迁移、健康与就绪、OpenAPI、Web 注册和登录入口、真实注册登录与身份读取、
备份恢复后的迁移记录、API 优雅关闭，以及替换 API 镜像后的登录和身份读取。脚本清理
创建的容器及网络，保留 `output/backups/m9-<suffix>.sql` 测试备份，须按本地资产策略管理。
默认替换镜像与当前镜像相同，只验证重启及替换流程；要验证旧版本应用回退，须提供独立的
已验证旧镜像 `-RollbackApiImage` 并检查其与当前数据库 schema 的兼容性。本演练不启用追踪，
也不证明生产部署或生产回退已通过。

## 故障与回退

- `trace_export_failed` 表示一个批次导出失败；`trace_queue_full` 在队列首次丢弃 span
  时报告，`trace_queue_dropped` 在队列恢复接收时报告该次丢弃数量。首次告警依赖锁定的
  OpenTelemetry SDK 2.0.1 的诊断信号，升级 SDK 时必须重跑故障测试；日志不输出
  exporter 原始异常或负载。
- `trace_export_partial_success` 表示 Collector 的 OTLP 响应报告了部分接收或警告；
  日志不包含 Collector 返回的详情或拒收数。该信号依赖锁定版本 SDK 的诊断消息，升级时
  须重跑 `tests/integration/tracing-partial-success.test.ts`。它是应用日志信号，不能
  代替生产告警或证明所有 span 已持久化。
- Collector 不可用时业务继续运行，浏览器遥测入口返回 503；丢失的批次不保证补传。
  检查容器日志和指标，恢复后发送新请求并用日志中的 trace ID 验证。
- 浏览器遥测转发检查 Collector 的 OTLP 响应；部分 span 被拒收、HTTP 失败或响应无效时
  返回 503 并记录 `trace_browser_export_failed`，Collector 返回警告但未拒收时记录
  `trace_browser_export_warning`。日志不记录 Collector 返回的原始错误信息。部分拒收可能
  已接收批次中的其他 span；当前浏览器 exporter 不重试失败批次，因此这些 span 不保证补传。
- 每个 API 服务实例最多并发转发 16 个浏览器遥测批次；超限时立即返回 503，记录
  `collector_concurrency_limit`。Collector 响应限制为 16 KiB，转发及读取共用 2 秒超时；
  超限或超时后释放名额，后续批次可以继续发送。这些限制不能替代部署入口的流量治理。
- 浏览器导出和 API 向 Collector 的转发均拒绝 HTTP 重定向；目标变更须直接更新配置。
  API 来源白名单基于 `Origin` 请求头，非浏览器客户端可以伪造该头，不能将它视为身份认证。
  每实例的速率和并发限制也不能替代生产入口的访问控制、流量治理和容量规划。
- 关闭浏览器采集需同时关闭 API 和 Web 开关并重启；关闭 API 采集设置
  `OTEL_TRACING_ENABLED=false` 并重启。原有认证、健康接口及 correlation ID 仍然存在。
- API 的两个采集开关均关闭时，未使用的 OTLP 地址、协议、采样和队列设置不会阻止 API 启动；
  开关本身仍需为 `true` 或 `false`。只启用浏览器采集时仍校验 OTLP 地址和协议；启用服务端
  采集时还会校验采样、队列和超时设置。修复配置并重新启用采集前，不会恢复已丢失的链路。
- 本地停用本手册创建的采集栈：

```powershell
podman compose -p pci-tracing -f deploy/compose.observability.local.yml down
```

此命令不管理 PostgreSQL；不要删除已有数据库、卷或其他项目的容器。

## 采集链路监控

本地 Collector 0.112.0 的 `127.0.0.1:8888/metrics` 提供以下指标；具体标签和
指标是否出现取决于组件及其是否处理过数据，Collector 重启后内存计数会重置：

- `otelcol_receiver_accepted_spans` 和 `otelcol_receiver_refused_spans`：接收端接受和拒绝的 span。
- `otelcol_exporter_sent_spans`、`otelcol_exporter_send_failed_spans` 和
  `otelcol_exporter_enqueue_failed_spans`：下游发送成功、最终发送失败和入队失败的 span。
- `otelcol_exporter_queue_size` 和 `otelcol_exporter_queue_capacity`：发送队列中的批次数及容量。

Collector 接受请求并返回 200 不代表查询存储已收到链路。导出重试中的批次可能已经离开
队列，此时队列深度仍为 0，最终发送失败计数也可能尚未增加。应同时监控指标抓取失败、
Collector 重试日志、接收及发送计数变化，以及用独立、无敏感信息的合成 trace 验证从接收到
受授权查询的完整路径。合成探测和监控访问须使用受保护的运维网络和身份；不要把测试查询
接口公开给普通用户。Collector 日志可能包含下游地址或错误细节，须限制访问并按实际环境审查。

仓库提供合成探测脚本，向配置的 OTLP HTTP/JSON 地址发送不含业务数据的随机 trace 和
span，并从 Jaeger HTTP API 查询同一 span。在本地采集栈启动后执行：

```powershell
$env:TRACING_PROBE_OTLP_URL='http://127.0.0.1:4318/v1/traces'
$env:TRACING_PROBE_JAEGER_URL='http://127.0.0.1:16686'
pnpm exec tsx scripts/operations/tracing-probe.ts
```

成功时输出 `tracing_probe_succeeded` 和随机 `trace_id`，退出码为 0；Collector 拒收、
确认无效、查询未授权或在总共 30 秒内未查到 span 时输出 `tracing_probe_failed` 并以
非零状态退出。查询的连接失败和非授权之外的 HTTP 错误会在时限内重试；输出不包含原始
错误或凭据。响应体上限为 64 KiB，查询地址可带路径前缀。地址不得包含凭据、查询串或
片段；非回环地址必须使用 HTTPS。可通过 `TRACING_PROBE_QUERY_TOKEN` 为查询请求提供
Bearer 凭据，该凭据不会发送给 Collector。脚本不支持 Collector 的应用层认证；部署时须
使用受保护的采集网络或经认证的本地代理，并由运维环境安全注入查询凭据，避免将其写入
命令行、日志或版本库。本地 Jaeger 未启用查询认证；脚本本身不能证明生产授权或告警已部署。

API 日志中的 `trace_export_failed`、`trace_export_partial_success`、`trace_queue_full`、`trace_queue_dropped` 和
`trace_browser_export_failed` 是应用侧信号。请求完成日志提供路由模板、状态和耗时，可供
受保护的日志平台计算错误率和延迟；不能用 trace 采样结果代替完整请求计数。生产告警必须
结合实际流量、重试时间、容量和服务目标确定阈值、接收人和恢复条件并演练；本地指标和日志
不表示生产告警已经配置。

## 生产前置条件

生产环境必须由运维负责人确定采样率、容量、保留和删除期限、备份与恢复、查询认证授权、
网络隔离和告警阈值，并验证队列饱和、网络超时、延迟和内存预算。浏览器来源和转发入口
需按部署环境限制，不能公开 Collector。头部采样不保证保留所有错误链路；如需保留，须
单独验证上游采样、Collector 尾采样与容量。`deploy/compose.production.yml` 已配置 Web V2、
本地 JWT 和容器内 3000/8080 端口，曾在 Podman 隔离环境中完成迁移、注册及链路查询；
这不构成生产部署验收。仓库全量构建仍未通过，`pnpm build:api` 可独立编译正式 API。

`deploy/Dockerfile.web-v2` 是当前 Compose 的 Web V2 镜像入口。
构建时必须设置浏览器可访问的 `NEXT_PUBLIC_API_BASE_URL`；浏览器采集开关
`NEXT_PUBLIC_OTEL_BROWSER_TRACING_ENABLED` 也在构建时固化，默认关闭。修改这些值需要
重新构建镜像。`deploy/.env.production.example` 是配置模板，数据库密码须与连接串中的密码
一致，连接串内的特殊字符须进行 URL 编码。容器内的 `127.0.0.1` 指容器自身，启用追踪时
必须配置 API 容器可访问的私有 Collector 地址。默认端口仅绑定宿主机回环地址；对外访问须
另行配置受保护的入口。生产查询授权、保留、备份和告警完成前不得将本地采集栈当作生产方案。

历史 M9 Compose 和示例保留作合同参考，依赖的 API Dockerfile 已变化，历史命令未经当前
代码验证；不得用它启动当前 Web V2 / 本地认证服务。
