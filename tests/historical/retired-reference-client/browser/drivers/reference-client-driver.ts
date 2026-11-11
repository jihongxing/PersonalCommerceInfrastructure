import { expect, type Page } from '@playwright/test';

export class ReferenceClientDriver {
  public constructor(private readonly page: Page) {}

  public async openHome(): Promise<void> {
    await this.page.goto('/');
    await expect(
      this.page.getByRole('heading', {
        name: '让你的服务更容易被了解',
      }),
    ).toBeVisible();
  }

  public async openRoute(
    route: '/creator' | '/customer' | '/public',
    heading: string,
  ): Promise<void> {
    await this.page.goto(route);
    await expect(this.page.getByRole('heading', { name: heading })).toBeVisible();
  }
}
