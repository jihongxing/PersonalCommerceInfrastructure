import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import QRCode from 'qrcode';
import { StableSharingTools } from './stable-sharing-tools';

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn() } }));

const reference = 'ACDEFH-3479JK-MNPQRT';
const url = 'https://commerce.test/r/ACDEFH3479JKMNPQRT';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('stable sharing tools', () => {
  it('uses one canonical address for QR, copy and share', async () => {
    vi.stubEnv('NEXT_PUBLIC_WEB_ORIGIN', 'https://commerce.test');
    vi.mocked(QRCode.toDataURL).mockResolvedValue('data:image/png;base64,cXI=' as never);
    const copy = vi.fn().mockResolvedValue(undefined);
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: copy },
    });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    render(<StableSharingTools reference={reference} />);
    expect(await screen.findByAltText('对外主页地址二维码')).toHaveAttribute(
      'src',
      'data:image/png;base64,cXI=',
    );
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ margin: 4, width: 1024 }),
    );
    expect(screen.getByText(url)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '复制链接' }));
    await userEvent.click(screen.getByRole('button', { name: '复制 C 号' }));
    await userEvent.click(screen.getByRole('button', { name: '分享' }));
    expect(copy).toHaveBeenCalledWith(url);
    expect(copy).toHaveBeenCalledWith(reference);
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url }));
    expect(screen.getByRole('link', { name: '下载二维码' })).toHaveAttribute(
      'href',
      'data:image/png;base64,cXI=',
    );
  });

  it('does not display a code when no valid address is available', () => {
    render(<StableSharingTools reference="invalid" />);
    expect(screen.getByText(/C 号尚未分配或无法加载/)).toBeInTheDocument();
    expect(screen.queryByAltText('对外主页地址二维码')).not.toBeInTheDocument();
    expect(QRCode.toDataURL).not.toHaveBeenCalled();
  });

  it('offers a retry when QR generation fails', async () => {
    vi.stubEnv('NEXT_PUBLIC_WEB_ORIGIN', 'https://commerce.test');
    vi.mocked(QRCode.toDataURL)
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce('data:image/png;base64,cXI=' as never);
    render(<StableSharingTools reference={reference} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('二维码生成失败');
    await userEvent.click(screen.getByRole('button', { name: '重试生成' }));
    await waitFor(() => expect(screen.getByAltText('对外主页地址二维码')).toBeInTheDocument());
  });

  it('clears the old QR and status when the reference changes', async () => {
    vi.stubEnv('NEXT_PUBLIC_WEB_ORIGIN', 'https://commerce.test');
    let resolveNext!: (value: string) => void;
    vi.mocked(QRCode.toDataURL)
      .mockResolvedValueOnce('data:image/png;base64,b2xk' as never)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveNext = resolve;
        }) as never,
      );
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const { rerender } = render(<StableSharingTools reference={reference} />);
    await screen.findByAltText('对外主页地址二维码');
    await userEvent.click(screen.getByRole('button', { name: '复制链接' }));
    expect(screen.getByText('链接已复制')).toBeInTheDocument();
    rerender(<StableSharingTools reference="ACDEFH-3479JK-MNPQRV" />);
    expect(screen.queryByAltText('对外主页地址二维码')).not.toBeInTheDocument();
    expect(screen.queryByText('链接已复制')).not.toBeInTheDocument();
    resolveNext('data:image/png;base64,bmV3');
    expect(await screen.findByAltText('对外主页地址二维码')).toHaveAttribute(
      'src',
      'data:image/png;base64,bmV3',
    );
  });

  it('reports copy failure and unsupported system share', async () => {
    vi.stubEnv('NEXT_PUBLIC_WEB_ORIGIN', 'https://commerce.test');
    vi.mocked(QRCode.toDataURL).mockResolvedValue('data:image/png;base64,cXI=' as never);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    render(<StableSharingTools reference={reference} />);
    await userEvent.click(screen.getByRole('button', { name: '复制链接' }));
    expect(screen.getByText('复制失败，请手动选择并复制链接')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '复制 C 号' }));
    expect(screen.getByText('复制失败，请手动选择并复制C 号')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '分享' }));
    expect(screen.getByText('当前浏览器不支持系统分享，请复制链接')).toBeInTheDocument();
  });

  it('does not report success when system sharing is cancelled', async () => {
    vi.stubEnv('NEXT_PUBLIC_WEB_ORIGIN', 'https://commerce.test');
    vi.mocked(QRCode.toDataURL).mockResolvedValue('data:image/png;base64,cXI=' as never);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')),
    });
    render(<StableSharingTools reference={reference} />);
    await userEvent.click(screen.getByRole('button', { name: '分享' }));
    expect(screen.queryByText('已调用系统分享')).not.toBeInTheDocument();
    expect(screen.queryByText('无法调用系统分享，请复制链接')).not.toBeInTheDocument();
  });
});
