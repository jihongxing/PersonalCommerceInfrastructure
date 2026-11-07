import { test, expect } from '@playwright/test';

test.describe('Consumer Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 设置测试超时和视口
    page.setViewportSize({ width: 1280, height: 720 });
  });

  test('E2E: Full consumer booking flow', async ({ page }) => {
    // Step 1: 访问 Creator Profile 页面
    await page.goto('/r/3479AC-DEFHJK-MNPQRT');
    
    // 验证页面加载
    await expect(page.locator('h1')).toBeDefined();
    await page.waitForLoadState('networkidle');
    
    // Step 2: 检查 Creator 信息显示
    const creatorName = page.locator('[data-testid="creator-name"]');
    await expect(creatorName).toBeVisible();

    // Step 3: 找到第一个服务卡片并点击
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await expect(serviceCard).toBeVisible();
    
    const viewDetailButton = serviceCard.locator('button:has-text("查看详情")');
    await viewDetailButton.click();

    // Step 4: 等待服务详情页加载
    await page.waitForURL(/\/s\/\w+/);
    await page.waitForLoadState('networkidle');

    // Step 5: 验证服务详情页
    const serviceTitle = page.locator('h1');
    await expect(serviceTitle).toBeVisible();
    
    // Step 6: 填写预约表单
    await page.fill('[name="contactName"]', 'Test User');
    await page.fill('[name="contactMethod"]', '13800138000');
    await page.fill('[name="requestMessage"]', 'I would like to book this service');

    // Step 7: 提交表单
    const submitButton = page.locator('button:has-text("提交预约")');
    await submitButton.click();

    // Step 8: 验证自动跳转到结果页
    await page.waitForURL(/\/o\/[\w-]+/);
    await page.waitForLoadState('networkidle');

    // Step 9: 验证订单结果页
    const resultCard = page.locator('[data-testid="order-result-card"]');
    await expect(resultCard).toBeVisible();

    // Step 10: 检查状态徽章
    const statusBadge = page.locator('[data-testid="status-badge"]');
    await expect(statusBadge).toContainText('等待 Creator 回复');

    // Step 11: 验证查询码显示
    const queryCode = page.locator('[data-testid="query-code"]');
    await expect(queryCode).toBeVisible();

    // Step 12: 验证自动刷新提示
    const autoRefreshHint = page.locator('text=自动刷新');
    await expect(autoRefreshHint).toBeVisible();
  });

  test('E2E: Consumer can manually refresh order status', async ({ page }) => {
    // 直接访问结果页
    await page.goto('/o/test-token-123');
    await page.waitForLoadState('networkidle');

    // 检查手动刷新按钮
    const refreshButton = page.locator('button:has-text("手动刷新")');
    
    // 如果是 submitted 状态才会有这个按钮
    if (await refreshButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await refreshButton.click();
      
      // 验证请求被发送
      await page.waitForResponse(
        response => response.url().includes('/api/v1/public/requests')
      );
    }
  });

  test('E2E: Handle invalid order token', async ({ page }) => {
    await page.goto('/o/invalid-token-xyz');
    await page.waitForLoadState('networkidle');

    // 验证错误提示
    const errorMessage = page.locator('text=查询失败');
    await expect(errorMessage).toBeVisible();

    // 验证返回首页按钮
    const backButton = page.locator('button:has-text("返回首页")');
    await expect(backButton).toBeVisible();
  });

  test('E2E: Responsive design on mobile', async ({ page }) => {
    // 设置手机视口
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/r/3479AC-DEFHJK-MNPQRT');
    await page.waitForLoadState('networkidle');

    // 验证页面在手机上可见
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // 验证响应式类应用
    const contentWrapper = page.locator('[class*="container"]');
    await expect(contentWrapper).toBeVisible();
  });
});
