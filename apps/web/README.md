# Web Reference Client

首个 Web Reference Client 只验证跨端客户端边界，不代表产品最终形态冻结为 Web。

## 当前范围

- Next.js App Router 壳层；
- Creator / Public / Customer 路由骨架；
- Tailwind CSS 基础样式；
- 由 API Contract 生成的 TypeScript Client 类型；
- 可替换的 `NEXT_PUBLIC_API_BASE_URL`；
- 不实现 Creator Identity、Offering、Request 或其他 VS-01 产品流程。

## 命令

```powershell
pnpm --filter @personal-commerce/web typecheck
pnpm --filter @personal-commerce/web build
```
