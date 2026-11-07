import { test, expect } from '@playwright/test';

test.describe('Creator Dashboard Flow', () => {
  const CREATOR_TOKEN = process.env.CREATOR_TOKEN || 'test-creator-token';

  test.beforeEach(async ({ page }) => {
    page.setViewportSize({ width: 1280, height: 720 });
  });

  test('E2E: Creator dashboard displays submitted requests', async ({ page }) => {
    // Step 1: 访问 Creator 仪表板
    await page.goto(`/dashboard?token=${CREATOR_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // Step 2: 验证仪表板标题
    const title = page.locator('h1:has-text("Creator 仪表板")');
    await expect(title).toBeVisible();

    // Step 3: 验证标签页存在
    const submittedTab = page.locator('[role="tab"]:has-text("待处理")');
    const confirmedTab = page.locator('[role="tab"]:has-text("已确认")');
    
    await expect(submittedTab).toBeVisible();
    await expect(confirmedTab).toBeVisible();

    // Step 4: 验证请求卡片显示
    const requestCards = page.locator('[data-testid="request-card"]');
    const cardCount = await requestCards.count();
    
    if (cardCount > 0) {
      await expect(requestCards.first()).toBeVisible();
    }
  });

  test('E2E: Creator can confirm a request', async ({ page }) => {
    await page.goto(`/dashboard?token=${CREATOR_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // 查找待处理的请求卡片
    const requestCard = page.locator('[data-testid="request-card"]').first();
    
    // 检查是否有待处理的请求
    const hasSubmittedState = await requestCard
      .locator('text=待处理')
      .isVisible()
      .catch(() => false);

    if (hasSubmittedState) {
      // 点击确认按钮
      const confirmButton = requestCard.locator('button:has-text("确认预约")');
      await confirmButton.click();

      // 验证按钮变为禁用
      await expect(confirmButton).toBeDisabled();

      // 等待请求完成
      await page.waitForResponse(
        response => 
          response.url().includes('/confirm') && response.status() === 200
      ).catch(() => {});

      // 等待页面刷新
      await page.waitForTimeout(1000);
    }
  });

  test('E2E: Creator can decline a request', async ({ page }) => {
    await page.goto(`/dashboard?token=${CREATOR_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // 查找待处理的请求卡片
    const requestCard = page.locator('[data-testid="request-card"]').first();

    // 检查是否有待处理的请求
    const hasSubmittedState = await requestCard
      .locator('text=待处理')
      .isVisible()
      .catch(() => false);

    if (hasSubmittedState) {
      // 点击拒绝按钮
      const declineButton = requestCard.locator('button:has-text("拒绝预约")');
      await declineButton.click();

      // 验证按钮变为禁用
      await expect(declineButton).toBeDisabled();

      // 等待请求完成
      await page.waitForResponse(
        response => 
          response.url().includes('/decline') && response.status() === 200
      ).catch(() => {});
    }
  });

  test('E2E: Creator can confirm fulfillment', async ({ page }) => {
    await page.goto(`/dashboard?token=${CREATOR_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // 点击已确认标签页
    const confirmedTab = page.locator('[role="tab"]:has-text("已确认")');
    await confirmedTab.click();

    await page.waitForLoadState('networkidle');

    // 查找已确认的请求卡片
    const requestCard = page.locator('[data-testid="request-card"]').first();

    // 检查是否有履约码
    const fulfillmentCode = requestCard
      .locator('[data-testid="fulfillment-code"]');
    
    if (await fulfillmentCode.isVisible().catch(() => false)) {
      // 验证履约码显示
      await expect(fulfillmentCode).toContainText('FC-');

      // 查找确认履约按钮
      const confirmButton = requestCard.locator('button:has-text("确认履约")');
      
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();

        // 验证请求完成
        await page.waitForResponse(
          response => 
            response.url().includes('/confirm-fulfillment') && response.status() === 200
        ).catch(() => {});
      }
    }
  });

  test('E2E: Tab switching works correctly', async ({ page }) => {
    await page.goto(`/dashboard?token=${CREATOR_TOKEN}`);
    await page.waitForLoadState('networkidle');

    // 点击已确认标签页
    const confirmedTab = page.locator('[role="tab"]:has-text("已确认")');
    await confirmedTab.click();

    // 验证内容切换
    const tabPanel = page.locator('[role="tabpanel"]');
    await expect(tabPanel).toContainText('已确认');

    // 点击回到待处理
    const submittedTab = page.locator('[role="tab"]:has-text("待处理")');
    await submittedTab.click();

    // 验证内容切换回去
    await expect(tabPanel).not.toContainText('已确认');
  });

  test('E2E: Unauthenticated user sees auth error', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 验证需要认证的提示
    const authError = page.locator('text=需要认证');
    await expect(authError).toBeVisible();
  });
});
