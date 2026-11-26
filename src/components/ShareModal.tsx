import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, ExternalLink, Loader2, Share2, X } from 'lucide-react';
import { pageUrl } from '../utils/handle';
import { qrPosterBlob, qrSvg } from '../utils/qr';
import { MyPRLogo } from './MyPRLogo';

interface ShareModalProps {
  isOpen: boolean;
  handle: string;
  name: string;
  /** False while pages are only saved on this device. */
  isPublic: boolean;
  onClose: () => void;
  onEditAddress: () => void;
}

type Tab = 'link' | 'qr';

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  handle,
  name,
  isPublic,
  onClose,
  onEditAddress,
}) => {
  const [tab, setTab] = useState<Tab>('link');
  const [copied, setCopied] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const url = pageUrl(handle);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);
    setQrError(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Build the QR code locally (no external service) whenever the address changes
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    qrSvg(url)
      .then((markup) => !cancelled && setSvg(markup))
      .catch(() => !cancelled && setSvg(null));
    return () => {
      cancelled = true;
    };
  }, [isOpen, url]);

  if (!isOpen) return null;

  const fileName = `mypr-${handle}-qr.png`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers: select-and-copy fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    try {
      await navigator.share({ title: `${name} | MyPR`, text: `${name}님의 MyPR 카드`, url });
    } catch {
      // Cancelled by the person, nothing to do
    }
  };

  const saveQr = async () => {
    setBusy('save');
    setQrError(null);
    try {
      const blob = await qrPosterBlob(url, name);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch {
      setQrError('QR 이미지를 만들지 못했어요. 다시 시도해주세요.');
    } finally {
      setBusy(null);
    }
  };

  const shareQr = async () => {
    setBusy('share');
    setQrError(null);
    try {
      const blob = await qrPosterBlob(url, name);
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${name} | MyPR`, text: url });
      } else {
        await saveQr();
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setQrError('QR 이미지를 공유하지 못했어요. "QR 저장"으로 저장한 뒤 보내주세요.');
      }
    } finally {
      setBusy(null);
    }
  };

  const tabClass = (t: Tab) =>
    `flex-1 h-10 rounded-xl text-[14px] font-semibold transition-colors cursor-pointer ${
      tab === t ? 'bg-[#111111] text-white' : 'text-[#555555] hover:text-[#111111]'
    }`;

  const outlineBtn =
    'h-12 rounded-2xl bg-white border border-[#E3E3E0] text-[14px] font-semibold inline-flex items-center justify-center gap-2 hover:border-[#111111] disabled:opacity-60 cursor-pointer';

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-[2px] sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-heading"
        className="w-full sm:max-w-[420px] max-h-[94dvh] overflow-y-auto bg-white rounded-t-[28px] sm:rounded-[28px] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_24px_60px_rgba(0,0,0,0.2)] animate-[popIn_220ms_cubic-bezier(0.22,1,0.36,1)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="share-heading" className="text-[17px] font-bold tracking-[-0.02em]">
            내 MyPR 공유하기
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center hover:bg-black/5 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {isPublic ? (
          <p className="mt-1 text-[14px] text-[#777777]">
            이 주소를 보내면 누구나 로그인 없이 내 카드를 볼 수 있어요.
          </p>
        ) : (
          <p className="mt-1 text-[14px] text-[#C2412B]">
            아직 서버에 저장되지 않아 다른 사람은 이 주소를 열 수 없어요.
          </p>
        )}

        <div className="mt-4 flex gap-1 rounded-2xl bg-[#F3F3F3] p-1" role="tablist" aria-label="공유 방법">
          <button type="button" role="tab" aria-selected={tab === 'link'} onClick={() => setTab('link')} className={tabClass('link')}>
            링크
          </button>
          <button type="button" role="tab" aria-selected={tab === 'qr'} onClick={() => setTab('qr')} className={tabClass('qr')}>
            QR 코드
          </button>
        </div>

        {tab === 'link' ? (
          <div role="tabpanel" aria-label="링크로 공유">
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white border border-[#E3E3E0] pl-4 pr-1.5 h-14">
              <span className="flex-1 min-w-0 truncate text-[15px] font-medium text-[#111111]" title={url}>
                {url.replace(/^https?:\/\//, '')}
              </span>
              <button
                type="button"
                onClick={copy}
                className="h-11 px-4 rounded-xl bg-[#111111] text-white text-[14px] font-bold inline-flex items-center gap-1.5 hover:bg-[#2A2A2A] transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? '복사됨' : '복사'}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {canNativeShare ? (
                <button type="button" onClick={share} className={outlineBtn}>
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  공유하기
                </button>
              ) : (
                <button type="button" onClick={onEditAddress} className={outlineBtn}>
                  주소 바꾸기
                </button>
              )}
              <a href={url} target="_blank" rel="noopener noreferrer" className={outlineBtn}>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                내 페이지 보기
              </a>
            </div>

            {canNativeShare && (
              <button
                type="button"
                onClick={onEditAddress}
                className="mt-3 mx-auto block h-9 px-3 rounded-xl text-[13px] text-[#777777] underline underline-offset-2 hover:text-[#111111] cursor-pointer"
              >
                주소 바꾸기
              </button>
            )}
          </div>
        ) : (
          <div role="tabpanel" aria-label="QR 코드로 공유" className="mt-4 flex flex-col items-center">
            <div className="relative w-[220px] h-[220px] border border-[#E3E3E0] rounded-2xl p-2 bg-white" data-testid="share-qr">
              {svg ? (
                <>
                  <div
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                    role="img"
                    aria-label={`${url} 로 연결되는 QR 코드`}
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[46px] h-[46px] rounded-[10px] bg-white flex items-center justify-center">
                    <MyPRLogo className="h-[30px] w-auto text-[#0A0A0A]" title="" />
                  </span>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[#999999] animate-spin" aria-label="QR 코드 만드는 중" />
                </div>
              )}
            </div>
            <p className="mt-3 text-[16px] font-bold tracking-[-0.02em] text-[#111111] text-center break-all">{name}</p>
            <p className="mt-0.5 text-[13px] text-[#777777] text-center break-all">{url.replace(/^https?:\/\//, '')}</p>
            <p className="mt-2 text-[12px] text-[#999999] text-center">휴대폰 카메라로 찍으면 내 페이지가 바로 열려요.</p>

            <div className="mt-4 w-full grid grid-cols-2 gap-2">
              <button type="button" onClick={saveQr} disabled={busy !== null} className={outlineBtn}>
                {busy === 'save' ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="w-4 h-4" aria-hidden="true" />
                )}
                QR 저장
              </button>
              {canNativeShare ? (
                <button type="button" onClick={shareQr} disabled={busy !== null} className={outlineBtn}>
                  {busy === 'share' ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Share2 className="w-4 h-4" aria-hidden="true" />
                  )}
                  QR 공유
                </button>
              ) : (
                <a href={url} target="_blank" rel="noopener noreferrer" className={outlineBtn}>
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  내 페이지 보기
                </a>
              )}
            </div>
            {qrError && (
              <p role="alert" className="mt-2 text-[13px] text-[#C2412B] text-center">
                {qrError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
