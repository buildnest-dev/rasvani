import { scrollToTarget } from '@/lib/scroll';
import { useUi, type Prefill } from '@/lib/ui-store';

let navigate: ((href: string) => void) | null = null;

/* Registered once by the layout so this helper can cross pages without a full reload (the prefill lives in memory). */
export function registerNavigate(fn: ((href: string) => void) | null) {
  navigate = fn;
}

/* Send the visitor to the waitlist form with fields prefilled (state card, festival card, PIN check). */
export function goToNotify(prefill: Omit<Prefill, 'nonce'> = {}) {
  useUi.getState().setPrefill(prefill);
  if (document.getElementById('notify')) {
    scrollToTarget('#notify');
    return;
  }
  if (navigate) navigate('/#notify');
  else window.location.assign('/#notify');
}
