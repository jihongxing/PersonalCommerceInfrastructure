import type { PublicOfferingUrlGenerator } from '../../applications/distribution/public-offering-url-generator.js';

export class StaticPublicOfferingUrlGenerator implements PublicOfferingUrlGenerator {
  public constructor(private readonly origin: string) {}

  public generate(offeringId: string): string {
    return `${this.origin.replace(/\/$/u, '')}/public/${encodeURIComponent(offeringId)}`;
  }
}
