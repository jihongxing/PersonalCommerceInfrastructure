# 跨端 Design Token Source of Truth

`design-tokens.json` 是跨端 Design Token 的唯一值来源。

它不属于 Web、App 或微信小程序；各客户端只能通过各自的 Adapter 消费它，不得在业务页面重新定义 Token 值。

当前状态：

- DS-01C 已冻结 Primitive Values 与 Semantic Token Values；
- Token 命名和语义来自 `docs/09_Engineering_Governance/27_DS01B_Cross_Platform_Design_Token_Contract.md`；
- `pnpm check:design-tokens` 负责校验颜色对比度、字体缩放、触控目标、焦点环和命名边界；
- 尚未生成 CSS Variables、Tailwind Theme、Native Theme 或 WXSS。
