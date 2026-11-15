// Navigation metadata only; it grants no backend permission.
export const sections = [
  { slug: '', label: '概览', english: 'Overview', description: '真实业务指标与近期运营事件。' },
  {
    slug: 'search',
    label: '全局检索',
    english: 'Global Search',
    description: '检索已授权模块中的真实业务记录。',
  },
  {
    slug: 'capabilities',
    label: '能力目录',
    english: 'Capability Catalog',
    description: '只读查看真实平台能力目录与当前状态。',
  },
  {
    slug: 'templates',
    label: '服务模板',
    english: 'Service Templates',
    description: '只读查看真实服务模板与已批准的发布范围。',
  },
  {
    slug: 'policy-versions',
    label: '政策版本',
    english: 'Policy Versions',
    description: '创建、校验并确认激活 Catalog 政策草稿。',
  },
  {
    slug: 'reports-appeals',
    label: '举报与申诉',
    english: 'Reports & Appeals',
    description: '服务举报与创作者申诉的处理入口。',
  },
  {
    slug: 'manual-reviews',
    label: '人工复核',
    english: 'Manual Reviews',
    description: '服务复核记录与处理决定。',
  },
  {
    slug: 'audit',
    label: '操作审计',
    english: 'Audit Records',
    description: '只读查看目录管理操作与执行归因。',
  },
  {
    slug: 'offerings',
    label: '服务 Offering',
    english: 'Service Offerings',
    description: '只读查看 Offering 状态、Creator 关联与分发记录。',
  },
  {
    slug: 'requests',
    label: 'Customer Request',
    english: 'Customer Requests',
    description: '只读查看 Request 状态、关联 Offering 与 Creator 决策。',
  },
] as const;
