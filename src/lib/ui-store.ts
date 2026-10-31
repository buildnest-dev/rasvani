import { create } from 'zustand';

/* Ephemeral UI state only (04-AI-RULES §4: server is the source of truth for cart/orders). */
export interface Prefill {
  dish?: string;
  state?: string;
  pin?: string;
  nonce: number;
}

interface UiState {
  introDone: boolean;
  panelCode: string | null;
  returnFocus: HTMLElement | SVGElement | null;
  pinDialogOpen: boolean;
  pin: string;
  prefill: Prefill | null;
  setIntroDone: () => void;
  openPanel: (code: string, trigger?: HTMLElement | SVGElement | null) => void;
  closePanel: () => void;
  setPinDialogOpen: (open: boolean) => void;
  loadPin: () => void;
  setPin: (pin: string) => void;
  setPrefill: (p: Omit<Prefill, 'nonce'>) => void;
}

const PIN_KEY = 'rv-pin';

export const useUi = create<UiState>((set) => ({
  introDone: false,
  panelCode: null,
  returnFocus: null,
  pinDialogOpen: false,
  pin: '',
  prefill: null,
  setIntroDone: () => set({ introDone: true }),
  openPanel: (code, trigger) => set({ panelCode: code, returnFocus: trigger ?? null }),
  closePanel: () => set({ panelCode: null }),
  setPinDialogOpen: (open) => set({ pinDialogOpen: open }),
  loadPin: () => {
    try {
      set({ pin: localStorage.getItem(PIN_KEY) ?? '' });
    } catch {
      /* storage blocked */
    }
  },
  setPin: (pin) => {
    try {
      localStorage.setItem(PIN_KEY, pin);
    } catch {
      /* storage blocked */
    }
    set({ pin });
  },
  setPrefill: (p) => set({ prefill: { ...p, nonce: Date.now() } }),
}));
