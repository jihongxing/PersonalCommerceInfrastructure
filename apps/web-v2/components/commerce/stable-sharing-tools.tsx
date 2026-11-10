'use client';

import { useEffect, useId, useState } from 'react';
import { Copy, Download, RotateCw, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { homepageUrl, normalizeReference } from '@/lib/public-homepage';
import { copyText } from '@/lib/copy-text';

export function StableSharingTools({ reference }: { reference?: string }) {
  const headingId = useId();
  const url = homepageUrl(reference ?? '');
  const [qr, setQr] = useState<{ url: string; image: string } | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState<{ url: string; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (url) {
      void QRCode.toDataURL(url, { width: 1024, margin: 4, errorCorrectionLevel: 'M' })
        .then((value) => {
          if (!cancelled) {
            setQr({ url, image: value });
            setFailedUrl(null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setQr(null);
            setFailedUrl(url);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [url, attempt]);

  async function copy(value: string, label: string) {
    setMessage(null);
    if (!url) return;
    const copied = await copyText(value);
    setMessage({ url, text: copied ? `${label}已复制` : `复制失败，请手动选择并复制${label}` });
  }

  async function share() {
    if (!url) return;
    setMessage(null);
    if (!navigator.share) {
      setMessage({ url, text: '当前浏览器不支持系统分享，请复制链接' });
      return;
    }
    try {
      await navigator.share({ title: '我的对外主页', url });
      setMessage({ url, text: '已调用系统分享' });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'AbortError'
      )
        return;
      setMessage({ url, text: '无法调用系统分享，请复制链接' });
    }
  }

  const currentQr = qr?.url === url ? qr.image : null;
  const qrError = Boolean(url && failedUrl === url);

  return (
    <section className="stable-sharing" aria-labelledby={headingId}>
      <h2 id={headingId}>对外稳定分享工具</h2>
      <p className="stable-sharing-intro">主页内容或方案切换时，C 号和分享地址保持不变</p>
      {url ? (
        <div className="stable-sharing-content">
          <div className="stable-sharing-qr">
            {currentQr && !qrError ? (
              <img src={currentQr} alt="对外主页地址二维码" width={144} height={144} />
            ) : qrError ? (
              <Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>
                <RotateCw aria-hidden="true" />
                重试生成
              </Button>
            ) : (
              <span>正在生成二维码...</span>
            )}
          </div>
          <div className="stable-sharing-details">
            <span>C 号</span>
            <strong className="stable-sharing-code">{reference}</strong>
            <span>分享链接</span>
            <span className="stable-sharing-url">{url}</span>
            <div className="stable-sharing-actions">
              <Button onClick={() => void copy(url, '链接')}>
                <Copy aria-hidden="true" />
                复制链接
              </Button>
              {reference && (
                <Button variant="outline" onClick={() => void copy(reference, 'C 号')}>
                  <Copy aria-hidden="true" />
                  复制 C 号
                </Button>
              )}
              {currentQr && !qrError && (
                <Button variant="outline" asChild>
                  <a href={currentQr} download="commerce-homepage.png">
                    <Download aria-hidden="true" />
                    下载二维码
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={() => void share()}>
                <Share2 aria-hidden="true" />
                分享
              </Button>
            </div>
            {qrError && <p role="alert">二维码生成失败，请重试。</p>}
          </div>
        </div>
      ) : (
        <p role="status" className="stable-sharing-unavailable">
          {reference && normalizeReference(reference)
            ? '公开地址尚未正确配置，请联系管理员。'
            : 'C 号尚未分配或无法加载，暂不能生成分享地址。'}
        </p>
      )}
      {message?.url === url && (
        <p role="status" className="stable-sharing-message">
          {message.text}
        </p>
      )}
      <p className="stable-sharing-note">C 号不证明身份或资质。主页能否访问取决于发布状态。</p>
    </section>
  );
}
