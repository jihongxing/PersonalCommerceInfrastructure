/**
 * 格式化货币金额
 * @param amountMinor - 最小单位的金额（分）
 * @param currency - 货币代码（如 'CNY'）
 * @returns 格式化后的货币字符串（如 '¥399.00'）
 */
export function formatCurrency(amountMinor: number, currency: string): string {
  const amountMajor = amountMinor / 100;
  
  const currencySymbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  
  const symbol = currencySymbols[currency] || currency;
  
  return `${symbol}${amountMajor.toFixed(2)}`;
}

/**
 * 格式化日期时间
 * @param dateString - ISO 8601 日期字符串
 * @returns 格式化后的日期字符串（如 '2025-01-15 14:30'）
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化相对时间
 * @param dateString - ISO 8601 日期字符串
 * @returns 相对时间字符串（如 '2小时前'）
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return formatDateTime(dateString);
}
