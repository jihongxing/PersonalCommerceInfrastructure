# 代码风格与命名治理

> **状态**：Decision v1  
> **Owner**：工程治理  
> **适用范围**：未来所有实现文件

## 权威来源

本文件是项目代码约定的事实源。具体语法格式以各语言生态的 Formatter 和 Linter 配置为准；业务术语、边界命名及兼容性敏感重命名以本文件为准。

## 格式化规则

- 每种语言只选择一套规范 Formatter 和一套规范 Linter。
- 首次实现时必须同时提交格式化和代码检查配置。
- 默认只格式化本次变更文件，除非明确批准全仓格式化迁移。
- 不使用仓库脚本重新实现语言解析器。
- 不把无关格式化变更混入产品变更单元。

## 通用命名原则

- 优先使用明确业务名称，避免泛化名称。
- `data`、`item`、`thing`、`manager`、`helper`、`utils` 不得作为业务能力所有者。
- 代码和测试统一使用 `Creator`、`Customer`、`Offering`、`Availability`、`CommerceAction`、`DistributionAsset`。
- 始终保持 Object、State、Event 三者的区别。
- 对象统一称为 `CommerceAction`；`Request` 仅作为 VS-01 中的用户动作名称。

## 业务模块命名

模块名称应表达业务能力，例如：

- `creator-commerce-identity`
- `service-offering`
- `distribution`
- `customer-request`
- `commerce-decision`
- `product-facts`

不得使用 `pages`、`dashboard`、`booking-page` 等页面名称定义业务模块。

## 命令、查询与事件

- 命令使用明确动词，例如 `CreateCommerceIdentity`、`PublishOffering`、`SubmitCommerceAction`、`ConfirmCommerceAction`。
- 查询描述读取意图，例如 `GetCreatorHome`、`GetPublicCommerceIdentity`、`ListCommerceRequests`。
- 规范事件使用 22 中登记的 snake_case 名称。
- 技术日志只有在映射到规范事件，或明确标记为非业务遥测时，才能使用实现专属名称。

## Port 与 Adapter

- Port 表达面向业务的能力和稳定合同。
- Adapter 包含 Provider SDK、传输细节、持久化细节和环境访问。
- 领域模块不得导入 Provider SDK。
- Adapter 应按外部能力和 Provider 边界命名，不按任意辅助行为命名。

## 应用与共享包

- 应用是组合根。
- 共享 Package 至少有两个真实使用方后才能抽取。
- 避免创建泛化共享包。
- 产品行为必须位于业务模块，而不是应用启动代码。

## 语言专项约定

M1 Foundation 已冻结以下技术基线：

| 能力 | 当前选择 |
| --- | --- |
| 语言与运行时 | TypeScript / Node.js 22 |
| 包管理器 | pnpm 10，必须提交 `pnpm-lock.yaml` |
| Formatter | Prettier |
| Linter | ESLint + typescript-eslint |
| 类型检查 | TypeScript strict mode |
| 单元 / 集成测试 | Vitest |
| 端到端 / 验收入口 | Vitest `tests/acceptance`；功能实现后可按真实需要扩展浏览器 Runner |
| CI | GitHub Actions Windows Runner |

规范命令：

```powershell
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm preflight
```

## 验证

治理预检负责验证本文件存在且已被索引，并调用已选定的 Formatter、Linter、类型检查、测试和构建命令。
