import { z } from 'zod';

/**
 * Creator Identity 验证 schemas
 */

export const IdentityFormSchema = z.object({
  displayName: z
    .string()
    .min(1, '名字不能为空')
    .max(120, '名字最多 120 字符'),
  bio: z
    .string()
    .min(1, '简介不能为空')
    .max(2000, '简介最多 2000 字符'),
  avatarUrl: z.string().url('头像 URL 格式不正确').optional().or(z.literal('')),
  location: z.string().max(100, '地址最多 100 字符').optional().or(z.literal('')),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(1, '平台不能为空'),
        url: z.string().url('URL 格式不正确'),
      })
    )
    .max(8, '最多添加 8 个社交链接')
    .optional()
    .or(z.literal(undefined)),
});

export type IdentityFormData = z.infer<typeof IdentityFormSchema>;

/**
 * Capability 验证 schemas
 */

export const CapabilityFormSchema = z.object({
  name: z
    .string()
    .min(1, '能力名称不能为空')
    .max(100, '能力名称最多 100 字符'),
  description: z
    .string()
    .min(1, '能力描述不能为空')
    .max(500, '能力描述最多 500 字符'),
});

export type CapabilityFormData = z.infer<typeof CapabilityFormSchema>;

/**
 * Service Offering 验证 schemas
 */

export const ServiceFormSchema = z.object({
  capabilityIds: z
    .array(z.string())
    .min(1, '至少需要关联一个能力')
    .max(5, '最多关联 5 个能力'),
  title: z
    .string()
    .min(1, '服务名称不能为空')
    .max(160, '服务名称最多 160 字符'),
  description: z
    .string()
    .min(1, '服务描述不能为空')
    .max(2000, '服务描述最多 2000 字符'),
  availabilityDescription: z
    .string()
    .min(1, '可用性描述不能为空')
    .max(1000, '可用性描述最多 1000 字符'),
  appearance: z
    .object({
      currency: z.string().optional(),
      priceRangeMin: z.number().min(0).optional(),
      priceRangeMax: z.number().min(0).optional(),
    })
    .optional(),
  requestInstructions: z
    .string()
    .min(1, '请求说明不能为空')
    .max(1000, '请求说明最多 1000 字符'),
});

export type ServiceFormData = z.infer<typeof ServiceFormSchema>;
