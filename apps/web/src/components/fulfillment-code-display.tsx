'use client';

import { useEffect, useState } from 'react';
import { Surface } from './ui/surface';
import { StatusMessage } from './ui/status-message';

interface FulfillmentCodeDisplayProps {
  readonly code: string;
  readonly status: 'pending' | 'fulfilled' | 'expired';
  readonly expiresAt: string;
  readonly fulfilledAt?: string;
  readonly apiBaseUrl: string;
}

export function FulfillmentCodeDisplay({
  code,
  status,
  expiresAt,
  fulfilledAt,
  apiBaseUrl,
}: FulfillmentCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Load QR code
    void loadQrCode();

    // Start countdown timer
    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 1000);

    return () => clearInterval(interval);
  }, [code, expiresAt]);

  async function loadQrCode(): Promise<void> {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/public/fulfillment-code/${code}/qrcode`,
      );
      if (response.ok) {
        const data = (await response.json()) as { dataUrl: string };
        setQrCodeDataUrl(data.dataUrl);
      }
    } catch {
      // Silently fail - QR code is optional
    }
  }

  function updateTimeRemaining(): void {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      setIsExpired(true);
      setTimeRemaining('已过期');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      setTimeRemaining(`${hours}小时${minutes}分钟`);
    } else if (minutes > 0) {
      setTimeRemaining(`${minutes}分钟${seconds}秒`);
    } else {
      setTimeRemaining(`${seconds}秒`);
    }
  }

  const statusText =
    status === 'fulfilled'
      ? '已核销'
      : isExpired || status === 'expired'
        ? '已过期'
        : '待核销';

  const statusColor =
    status === 'fulfilled'
      ? 'text-green-600'
      : isExpired || status === 'expired'
        ? 'text-red-600'
        : 'text-blue-600';

  return (
    <Surface className="ds-section-stack" tone="subtle">
      <div className="ds-section-stack">
        <h3 className="ds-heading-section">履约码</h3>

        {/* Status Badge */}
        <div className={`text-sm font-medium ${statusColor}`}>{statusText}</div>

        {/* Fulfillment Code */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold tracking-wider">{code}</div>
          {status === 'pending' && !isExpired ? (
            <div className="text-sm text-gray-600 mt-2">剩余时间：{timeRemaining}</div>
          ) : null}
          {status === 'fulfilled' && fulfilledAt ? (
            <div className="text-sm text-gray-600 mt-2">
              核销时间：{new Date(fulfilledAt).toLocaleString('zh-CN')}
            </div>
          ) : null}
        </div>

        {/* QR Code */}
        {qrCodeDataUrl.length > 0 && status === 'pending' && !isExpired ? (
          <div className="flex justify-center">
            <img
              src={qrCodeDataUrl}
              alt={`履约码 ${code} 的二维码`}
              className="w-64 h-64 border-2 border-gray-300 rounded"
            />
          </div>
        ) : null}

        {/* Instructions */}
        {status === 'pending' && !isExpired ? (
          <StatusMessage>
            请向 Creator 出示此履约码或二维码。Creator 扫码后，服务将被标记为已完成。
          </StatusMessage>
        ) : null}

        {isExpired || status === 'expired' ? (
          <StatusMessage>此履约码已过期，无法使用。请联系 Creator。</StatusMessage>
        ) : null}

        {status === 'fulfilled' ? (
          <StatusMessage>此履约码已被核销，服务已完成。</StatusMessage>
        ) : null}
      </div>
    </Surface>
  );
}
