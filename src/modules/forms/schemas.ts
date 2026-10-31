import { z } from 'zod';

/* Shared by the client forms (react-hook-form) and the server actions (04-AI-RULES §3.6: validate on the server). */
export const PIN_RE = /^[1-9]\d{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;

export const pinSchema = z.string().trim().regex(PIN_RE, 'Enter a 6-digit PIN code, for example 800001.');

const contactSchema = z
  .string()
  .trim()
  .refine((v) => EMAIL_RE.test(v) || PHONE_RE.test(v), 'Enter a 10-digit mobile number or an email address.');

const consentSchema = z.boolean().refine((v) => v, 'Please tick the box so we can contact you.');

export const waitlistSchema = z.object({
  dish: z.string().trim().min(1, 'Tell us which food you miss.').max(120),
  state: z.string().max(4),
  pin: pinSchema,
  contact: contactSchema,
  consent: consentSchema,
});
export type WaitlistInput = z.infer<typeof waitlistSchema>;

export const makerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(120),
  contact: contactSchema,
  state: z.string().min(1, 'Choose a state.').max(4),
  what: z.string().trim().min(1, 'Tell us what you make.').max(200),
  consent: consentSchema,
});
export type MakerInput = z.infer<typeof makerSchema>;
