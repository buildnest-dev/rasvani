'use client';

import { useEffect, useRef } from 'react';
import { useUi } from '@/lib/ui-store';
import { PinCheck } from './pin-check';

export function PinDialog() {
  const open = useUi((s) => s.pinDialogOpen);
  const setOpen = useUi((s) => s.setPinDialogOpen);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="pin-dialog"
      aria-labelledby="pinDlgTitle"
      onClose={() => setOpen(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <button type="button" className="state-panel__close pin-dialog__close" aria-label="Close" onClick={() => setOpen(false)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <h2 className="pin-dialog__title" id="pinDlgTitle">
        Where should we deliver?
      </h2>
      {open && <PinCheck variant="dialog" inputId="dlgPin" onNotify={() => setOpen(false)} />}
    </dialog>
  );
}
