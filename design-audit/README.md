# VS-01 Design Audit Demo

这是现有产品 UI 重构前的隔离视觉审计 Demo。

## 内容

同一套 Quiet Commerce Desk 设计语言覆盖：

- 桌面端 Creator 工作台；
- 移动端 Creator 工作台；
- Offer 编辑；
- Public Offering；
- Customer Request；
- Confirmed 结果状态；
- Draft、Submitted、Confirmed 等状态层级；
- 页面边界说明、唯一主操作和响应式构图。

页面切换和桌面/移动视图切换只用于审计，所有按钮均不调用 API。

## 运行

从仓库根目录执行：

```powershell
python -m http.server 45800 --directory design-audit
```

打开：

```text
http://127.0.0.1:45800
```

## 审计顺序

1. 桌面端 `工作台概览`；
2. 桌面端 `Offer 编辑`；
3. 移动端 `公开服务`；
4. 移动端 `提交请求`；
5. 移动端 `结果状态`；
6. 最后切换不同页面，检查同一套视觉语言是否成立。

本 Demo 不代表已批准的产品实现，不改变现有 `apps/web`、API、领域模型或验收测试。
