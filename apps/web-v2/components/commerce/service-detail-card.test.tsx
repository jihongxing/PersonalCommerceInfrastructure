import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ServiceDetailCard } from './service-detail-card';
const base = {
  id: 'offering',
  title: '服务',
  description: '说明',
  availabilityDescription: '单独联系确认',
  requestInstructions: '需求',
};
const appearance = {
  appearanceType: 'photo' as const,
  startsOn: '2026-11-20',
  endsOn: '2026-11-21',
  locationDescription: '上海',
  buyerType: 'approved_external_requester' as const,
  requestCallToAction: '提交请求',
  upcomingTitle: '活动标题内容',
  pricingRule: '按合作范围讨论',
  externalUrl: 'https://example.test/event',
};
describe('Public Appearance context', () => {
  it('renders full activity context and neutral requester copy without replacing Availability', () => {
    render(<ServiceDetailCard offering={{ ...base, appearance }} />);
    for (const text of [
      '拍照活动',
      '上海',
      '外部请求方',
      '活动标题内容',
      '按合作范围讨论',
      '单独联系确认',
    ])
      expect(screen.getByText(text)).toBeTruthy();
    expect(screen.getByText('2026-11-20')).toBeTruthy();
    expect(screen.getByText('2026-11-21')).toBeTruthy();
    expect(screen.queryByText(/经认证/)).toBeNull();
    expect(screen.getByRole('link').getAttribute('href')).toBe(appearance.externalUrl);
    expect(screen.getByRole('link').getAttribute('rel')).toContain('noopener');
  });
  it('supports minimal metadata and ordinary Offerings', () => {
    const { rerender } = render(<ServiceDetailCard offering={base} />);
    expect(screen.queryByText('活动详情')).toBeNull();
    const minimal = {
      appearanceType: 'guest' as const,
      startsOn: '2026-11-20',
      locationDescription: '地点',
      buyerType: 'organizer' as const,
      requestCallToAction: '提交请求',
    };
    rerender(<ServiceDetailCard offering={{ ...base, appearance: minimal }} />);
    expect(screen.getByText('嘉宾出席')).toBeTruthy();
    expect(screen.queryByText('活动标题')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('renders unsafe historical external URLs as text instead of executable links', () => {
    render(
      <ServiceDetailCard
        offering={{ ...base, appearance: { ...appearance, externalUrl: 'javascript:alert(1)' } }}
      />,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('javascript:alert(1)')).toBeTruthy();
  });
});
