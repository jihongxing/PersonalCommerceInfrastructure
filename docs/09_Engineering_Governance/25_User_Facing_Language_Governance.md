# 25 — 用户界面语言治理

> **状态**：UI-LANG-01 已建立  
> **范围**：Web Reference Client 的用户可见语言  
> **最后更新**：2026-08-12

## 1. 目的

防止领域对象、API、状态机、Provider 和错误实现细节直接暴露给用户。

本治理只约束呈现层，不修改领域对象、API Contract、产品状态或 Canonical Event。

## 2. 语言边界

```text
Domain / API / Event
        ↓
User-Facing Message Adapter
        ↓
Copy Catalog
        ↓
UI Surface
```

- 领域层可以使用精确工程术语；
- API 错误必须经过用户语言适配器；
- 用户可见业务文案必须来自 `apps/web/src/content/`；
- 组件不得直接透传 API 原始错误消息；
- 内部状态必须转换为用户可理解的状态名称。

## 3. 强制规则

- 用户可见文案不得直接使用 API、数据库、Provider、状态机或内部对象名称；
- 不得渲染 `response.error.error.message` 或 `error.message`；
- 所有用户可见业务文案必须进入 Copy Catalog；
- 已知错误码必须经过用户语言映射，未知错误使用安全兜底文案；
- 测试标识、代码类型、API 路径和日志可以使用内部术语，但不得渲染给用户。

默认禁止进入用户界面的术语包括：

`Commerce Identity`、`Capability`、`Commerce Action`、`Confirmed Commerce`、`Paid Transaction`、`Access Token`、`Bearer Token`、`API`、`Actor`、`Repository`、`Provider`、`Draft`、`Published`、`Unpublished`。

## 4. 强制门禁

`pnpm check:user-copy` 扫描 Web JSX / TSX：

- 检查禁止术语是否出现在用户可见 JSX 文本或属性；
- 禁止 JSX 中直接写入静态用户文案或静态用户可见属性，强制通过 Copy Catalog 提供；
- 检查客户端组件是否直接透传错误消息；
- 发现违规时返回非零退出码；
- 该检查必须接入根 `pnpm preflight` 与 CI。

## 5. UI-LANG-01 结果

| 项目 | 状态 |
| --- | --- |
| Copy Catalog | 已建立 |
| User-Facing Message Adapter | 已建立 |
| Creator Identity Workspace 改造 | 已完成 |
| 当前 Web 用户文案扫描 | 已完成 |
| Preflight 接入 | 已完成 |
| 产品定义 / API / 状态机变化 | 无 |

## 6. 验收标准

- 用户界面不直接显示内部对象名称；
- 用户界面不直接显示 API 原始错误；
- 未知错误不会泄漏内部实现信息；
- 状态显示使用用户语言；
- `pnpm check:user-copy` 通过；
- `pnpm preflight` 通过。
