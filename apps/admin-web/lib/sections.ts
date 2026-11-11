// Navigation metadata only; it grants no backend permission.
export const sections = [
  { slug: '', label: '概览', english: 'Overview', description: '管理工作台的当前开放范围。' },
  {
    slug: 'capabilities',
    label: '能力目录',
    english: 'Capability Catalog',
    description: '平台能力目录的状态与选择开关。',
  },
  {
    slug: 'templates',
    label: '服务模板',
    english: 'Service Templates',
    description: '服务模板与已批准的发布范围。',
  },
  {
    slug: 'policy-versions',
    label: '政策版本',
    english: 'Policy Versions',
    description: '目录发布版本与版本历史。',
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
    description: '目录管理操作的可追溯记录。',
  },
] as const;
