import type { ServiceOffering } from '../api/use-creator-services';

export const offeringLifecycle = {
  draft: { label: '草稿', description: '可编辑；满足发布条件后可以发布。' },
  published: { label: '已发布', description: '可编辑或下架；下架后不再接收新请求。' },
  unpublished: { label: '未发布', description: '已撤回公开展示；可编辑并按发布条件重新发布。' },
  archived: { label: '已归档', description: '仅可查看历史信息；不能编辑或重新发布。' },
} satisfies Record<ServiceOffering['state'], { label: string; description: string }>;
