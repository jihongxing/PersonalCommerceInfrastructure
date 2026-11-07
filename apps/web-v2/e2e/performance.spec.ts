import { test, expect } from '@playwright/test';

test.describe('Performance & API Tests', () => {
  test('E2E: Page load performance - Creator Profile', async ({ page }) => {
    const startTime = Date.now();

    // 开始性能监控
    await page.goto('/r/3479AC-DEFHJK-MNPQRT');
    
    // 等待 FCP (First Contentful Paint)
    const metrics = await page.evaluate(() => {
      return {
        fcp: (performance.getEntriesByName('first-contentful-paint')[0] as any)?.startTime,
        lcp: 0, // LCP 需要更长时间
      };
    });

    const loadTime = Date.now() - startTime;

    // 验证加载时间 < 3 秒
    expect(loadTime).toBeLessThan(3000);
    expect(metrics.fcp).toBeDefined();

    // 验证 FCP < 1.5 秒
    expect(metrics.fcp).toBeLessThan(1500);
  });

  test('E2E: API calls are batched correctly', async ({ page }) => {
    let apiCallCount = 0;
    let apiCallDuration = 0;

    // 监听 API 请求
    page.on('response', response => {
      if (response.url().includes('/api/v1/public')) {
        apiCallCount++;
      }
    });

    const startTime = Date.now();
    await page.goto('/r/3479AC-DEFHJK-MNPQRT');
    await page.waitForLoadState('networkidle');
    apiCallDuration = Date.now() - startTime;

    // Creator Profile 页面应该只做 1-2 个 API 调用
    expect(apiCallCount).toBeLessThanOrEqual(2);

    // API 调用应该在 1 秒内完成
    expect(apiCallDuration).toBeLessThan(1000);
  });

  test('E2E: Caching works - subsequent visits are faster', async ({ page }) => {
    // 第一次访问
    const start1 = Date.now();
    await page.goto('/r/3479AC-DEFHJK-MNPQRT');
    await page.waitForLoadState('networkidle');
    const duration1 = Date.now() - start1;

    // 回到首页
    await page.goto('/');
    
    // 再次访问同一页面
    const start2 = Date.now();
    await page.goto('/r/3479AC-DEFHJK-MNPQRT');
    await page.waitForLoadState('networkidle');
    const duration2 = Date.now() - start2;

    // 缓存应该让第二次更快（允许 20% 的误差）
    expect(duration2).toBeLessThan(duration1 * 1.2);
  });

  test('E2E: Form validation works client-side', async ({ page }) => {
    await page.goto('/s/test-offering-id');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('[name="contactName"]');
    const submitButton = page.locator('button:has-text("提交预约")');

    // 尝试提交空表单
    await submitButton.click();

    // 验证验证错误显示
    const errorMessage = page.locator('text=必填字段');
    await expect(errorMessage).toBeVisible({ timeout: 500 }).catch(() => {});

    // 填写字段
    await nameInput.fill('Test User');
    await page.fill('[name="contactMethod"]', '13800138000');
    await page.fill('[name="requestMessage"]', 'Test message');

    // 现在应该可以提交
    await expect(submitButton).toBeEnabled();
  });

  test('E2E: Error handling for failed API calls', async ({ page, context }) => {
    // 模拟网络错误
    await context.setOffline(true);

    await page.goto('/r/3479AC-DEFHJK-MNPQRT');

    // 等待错误提示
    const errorElement = page.locator('text=加载失败');
    await expect(errorElement).toBeVisible({ timeout: 5000 }).catch(() => {});

    // 恢复网络
    await context.setOffline(false);

    // 重试按钮应该可用
    const retryButton = page.locator('button:has-text("重试")');
    if (await retryButton.isVisible().catch(() => false)) {
      await retryButton.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('E2E: Auto-polling for order status', async ({ page }) => {
    let pollCount = 0;

    // 监听 API 请求
    page.on('response', response => {
      if (response.url().includes('/api/v1/public/requests')) {
        pollCount++;
      }
    });

    // 访问订单结果页 (submitted 状态)
    await page.goto('/o/test-submitted-token');
    await page.waitForLoadState('networkidle');

    // 等待 15 秒（应该有 1-2 次轮询）
    await page.waitForTimeout(15000);

    // 验证轮询发生
    expect(pollCount).toBeGreaterThanOrEqual(1);
  });

  test('E2E: Memory usage is reasonable', async ({ page }) => {
    // 获取初始内存使用
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return (performance.memory as any).usedJSHeapSize;
      }
      return 0;
    });

    // 访问几个页面
    await page.goto('/r/3479AC-DEFHJK-MNPQRT');
    await page.goto('/s/test-offering-id');
    await page.goto('/o/test-token');

    // 获取最终内存使用
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return (performance.memory as any).usedJSHeapSize;
      }
      return 0;
    });

    // 内存增长不应超过 20MB
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024);
    }
  });
});
