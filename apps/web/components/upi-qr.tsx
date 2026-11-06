'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** Draws a UPI payment QR in the browser. Nothing is sent to any server. */
export function UpiQr({ link, label }: { link: string; label: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(link, { width: 240, margin: 1, errorCorrectionLevel: 'M' }).then((url) => { if (active) setSrc(url); }).catch(() => { if (active) setSrc(''); });
    return () => { active = false; };
  }, [link]);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img className="upi-qr" src={src} width={240} height={240} alt={label} /> : <div className="upi-qr upi-qr-empty" aria-hidden="true" />;
}
