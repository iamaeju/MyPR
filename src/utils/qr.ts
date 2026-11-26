import QRCode from 'qrcode';

const INK = '#0A0A0A';
const PAPER = '#FFFFFF';

/**
 * High error correction (H, ~30%) so the MyPR mark in the middle never
 * stops the code from scanning.
 */
const QR_OPTIONS = { errorCorrectionLevel: 'H' as const, margin: 1, color: { dark: INK, light: PAPER } };

/** SVG markup of the QR code for a link. */
export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...QR_OPTIONS, type: 'svg' });
}

/** The MyPR mark (four stacked cards), drawn into a box on a canvas. */
function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  const vbW = 626;
  const vbH = 891;
  const s = height / vbH;
  const ox = x - (vbW * s) / 2;
  const rects: Array<[number, number, number, number, number]> = [
    [80, 0, 459, 891, 0.4],
    [61, 71, 497, 750, 0.6],
    [33, 156, 553, 580, 0.7],
    [0, 240, 626, 412, 1],
  ];
  ctx.save();
  ctx.fillStyle = INK;
  for (const [rx, ry, rw, rh, alpha] of rects) {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.roundRect(ox + rx * s, y + ry * s, rw * s, rh * s, 20 * s);
    ctx.fill();
  }
  ctx.restore();
}

/** White rounded badge with the mark, placed over the centre of a QR code. */
function drawCenterBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, qrSize: number) {
  const badge = qrSize * 0.22;
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.roundRect(cx - badge / 2, cy - badge / 2, badge, badge, badge * 0.22);
  ctx.fill();
  ctx.restore();
  drawMark(ctx, cx, cy - badge * 0.34, badge * 0.68);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/**
 * A shareable 1080×1350 image: QR code with the MyPR mark, the person's name
 * and their address underneath.
 */
export async function qrPosterBlob(url: string, name: string): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported');

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Header: mark + wordmark
  const fontStack = '"Plus Jakarta Sans", "Pretendard Variable", -apple-system, system-ui, sans-serif';
  drawMark(ctx, 108, 92, 64);
  ctx.fillStyle = INK;
  ctx.font = `700 48px ${fontStack}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('MyPR', 150, 126);

  // QR code
  const qrSize = 720;
  const qrX = (W - qrSize) / 2;
  const qrY = 230;
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, url, { ...QR_OPTIONS, width: qrSize });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
  drawCenterBadge(ctx, W / 2, qrY + qrSize / 2, qrSize);

  // Name + address
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `700 64px ${fontStack}`;
  ctx.fillText(fitText(ctx, name, W - 160), W / 2, qrY + qrSize + 110);
  ctx.fillStyle = '#6B6B6B';
  ctx.font = `500 36px ${fontStack}`;
  ctx.fillText(fitText(ctx, url.replace(/^https?:\/\//, ''), W - 160), W / 2, qrY + qrSize + 180);

  // Footer rule + tagline
  ctx.fillStyle = INK;
  ctx.fillRect(80, H - 110, W - 160, 2);
  ctx.font = `500 28px ${fontStack}`;
  ctx.fillText('Present yourself, by yourself.', W / 2, H - 64);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create image'))), 'image/png')
  );
}
