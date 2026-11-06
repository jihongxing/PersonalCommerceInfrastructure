'use client';

import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from './ui/button';
import { Surface } from './ui/surface';
import { StatusMessage } from './ui/status-message';

interface QrCodeScannerProps {
  readonly onCodeScanned: (code: string) => void;
  readonly onCancel: () => void;
}

export function QrCodeScanner({ onCodeScanned, onCancel }: QrCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    startScanner();
    return () => {
      if (scanner !== null) {
        scanner.stop();
        scanner.destroy();
      }
    };
  }, []);

  async function startScanner(): Promise<void> {
    if (videoRef.current === null) {
      return;
    }

    try {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          if (scanning) {
            return; // Prevent duplicate scans
          }
          const code = result.data.trim();
          // Validate fulfillment code format: FC-XXXXXXXX
          if (/^FC-[A-Z0-9]{8}$/.test(code)) {
            setScanning(true);
            qrScanner.stop();
            onCodeScanned(code);
          } else {
            setError('扫描到的不是有效的履约码格式。请扫描正确的二维码。');
            setTimeout(() => setError(''), 3000);
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        },
      );

      await qrScanner.start();
      setScanner(qrScanner);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('需要摄像头权限才能扫描二维码。请在浏览器设置中允许访问摄像头。');
        } else if (err.name === 'NotFoundError') {
          setError('未检测到摄像头设备。');
        } else {
          setError('无法启动摄像头扫描。请检查设备权限或尝试刷新页面。');
        }
      }
    }
  }

  return (
    <Surface className="ds-section-stack" tone="raised">
      <div className="ds-section-stack">
        <h3 className="ds-heading-section">扫描履约码</h3>

        {error.length > 0 ? <StatusMessage>{error}</StatusMessage> : null}

        <div className="relative w-full max-w-md mx-auto">
          <video
            ref={videoRef}
            className="w-full h-auto rounded border-2 border-gray-300"
            style={{ maxHeight: '400px' }}
          />
          {scanning ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
              <div className="text-white text-lg font-medium">正在处理...</div>
            </div>
          ) : null}
        </div>

        <StatusMessage>
          请将 Customer 展示的履约码二维码对准摄像头，系统会自动识别并核销。
        </StatusMessage>

        <Button onClick={onCancel} type="button" variant="outline">
          取消扫描
        </Button>
      </div>
    </Surface>
  );
}
