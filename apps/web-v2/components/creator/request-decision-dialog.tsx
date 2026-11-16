'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import type { CreatorRequest } from '@/features/creator-dashboard/api/use-creator-requests';

export type RequestDecision = 'confirm' | 'decline';

export function RequestDecisionDialog({
  request,
  decision,
  available,
  onCommit,
  onSuccess,
  onDismiss,
}: {
  request: CreatorRequest;
  decision: RequestDecision;
  available: boolean;
  onCommit: () => Promise<unknown>;
  onSuccess: () => void;
  onDismiss: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const resultMessage = useRef<HTMLParagraphElement>(null);
  const pendingMessage = useRef<HTMLParagraphElement>(null);
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const id = useId();
  const confirming = decision === 'confirm';

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  useEffect(() => {
    // Disabling the active submit button otherwise leaves focus on the document body.
    if (pending) pendingMessage.current?.focus();
    else if (error) resultMessage.current?.focus();
  }, [pending, error]);

  async function commit() {
    // A synchronous guard also covers two clicks before React renders disabled controls.
    if (inFlight.current || !available) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    try {
      await onCommit();
      inFlight.current = false;
      dialog.current?.close();
      onSuccess();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '提交失败，请重试。';
      setError(
        cause instanceof ApiError && cause.status === 409
          ? `请求状态发生冲突，已请求刷新列表。${message}`
          : `未能确认操作结果，已请求刷新列表，请核对后重试。${message}`,
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="creator-decision-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      aria-busy={pending}
      closedby={pending ? 'none' : 'closerequest'}
      onCancel={(event) => {
        if (inFlight.current) event.preventDefault();
      }}
      onClose={(event) => {
        // Preserve the in-flight result even where closedBy is not supported.
        if (inFlight.current) event.currentTarget.showModal();
        else onDismiss();
      }}
    >
      <h2 id={`${id}-title`} className="text-xl font-semibold">
        {confirming ? '确认此请求？' : '拒绝此请求？'}
      </h2>
      <p id={`${id}-description`} className="mt-3 text-sm">
        {confirming
          ? '确认后，此决定不可撤销，也不能改为拒绝。确认请求不代表已完成履约，履约确认是后续独立操作。'
          : '拒绝后，此决定不可撤销，也不能改为确认。客户将看到此请求已被拒绝。'}
      </p>
      <dl className="my-5 space-y-3 text-sm break-words">
        <div>
          <dt className="font-medium">服务</dt>
          <dd>{request.offering.title}</dd>
        </div>
        <div>
          <dt className="font-medium">客户</dt>
          <dd>{request.customer.contactName}</dd>
        </div>
        <div>
          <dt className="font-medium">联系方式</dt>
          <dd className="break-all">{request.customer.contactMethod}</dd>
        </div>
        <div>
          <dt className="font-medium">请求编号</dt>
          <dd className="break-all">{request.action.id}</dd>
        </div>
        <div>
          <dt className="font-medium">请求说明</dt>
          <dd className="whitespace-pre-wrap">{request.action.requestMessage}</dd>
        </div>
      </dl>
      {error && (
        <p ref={resultMessage} tabIndex={-1} role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {!available && (
        <p role="status" className="mb-4 text-sm">
          当前无法确认此请求仍为待处理状态，不能继续提交。请关闭弹窗查看最新状态。
        </p>
      )}
      {pending && (
        <p ref={pendingMessage} tabIndex={-1} className="mb-4 text-sm">
          正在提交并核对最新状态，请等待；提交期间无法取消。
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <Button
          autoFocus
          variant="outline"
          className="min-h-11"
          disabled={pending}
          onClick={() => {
            if (!inFlight.current) dialog.current?.close();
          }}
        >
          取消
        </Button>
        <Button
          variant={confirming ? 'default' : 'destructive'}
          className="min-h-11"
          disabled={pending || !available}
          onClick={() => void commit()}
        >
          {pending ? '提交中…' : confirming ? '确认接受' : '确认拒绝'}
        </Button>
      </div>
    </dialog>
  );
}
