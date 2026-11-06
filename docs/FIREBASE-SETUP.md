# Rasvani on Firebase: setup checklist

Rasvani uses **Firebase Auth** (Google, email verification, Apple later) and **Firestore** (products, orders, roles).
Three entrances, one codebase:

| Site | Who | How access is decided |
|---|---|---|
| `rasvani.com` | Customers (Bihar for now) | Any signed-in user with a **verified email** can order |
| `admin.rasvani.com` | Rasvani staff | Email must be in `ADMIN_EMAILS` **and** verified |
| `baker.rasvani.com` | Home bakers / restaurants | Admin adds their email under "Bakers"; they must verify it |

All writes (orders, prices, roles, status changes) run on the server and re-check the user's token and role.
`firestore.rules` lets browsers only read what they may see. Orders are priced on the server from the product
documents, so a customer cannot change a price.

## 1. Firebase console (project `rasvani2026`)
1. **Build > Firestore Database > Create database**: Native mode, region `asia-south1` (Mumbai). Start in production mode.
2. **Firestore > Rules**: paste the contents of `firestore.rules` and **Publish**.
3. **Build > Authentication > Get started > Sign-in method**: enable **Email/Password** and **Google**.
4. **Authentication > Settings > Authorized domains**: add `rasvani.com`, `www.rasvani.com`, `admin.rasvani.com`,
   `baker.rasvani.com` and your `*.vercel.app` preview domain.
5. **Project settings > Service accounts > Generate new private key**: keep the downloaded JSON secret.
6. Apple sign-in later: needs a paid Apple Developer account. Enable the Apple provider, then set `NEXT_PUBLIC_APPLE_SIGNIN=1`.
7. Mobile-number (SMS OTP) verification: later. It needs the Blaze plan.

## 2. Vercel environment variables
Copy every name from `apps/web/.env.example`. Required: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_APP_ID`,
`FIREBASE_SERVICE_ACCOUNT_JSON`, `ADMIN_EMAILS`. Root Directory must be `apps/web`.
Add the three domains to the Vercel project (`rasvani.com`, `admin.rasvani.com`, `baker.rasvani.com`).
When all three work, set `ENFORCE_STAFF_SUBDOMAINS=1`.

## 3. First use
1. Open `admin.rasvani.com`, sign in with an email listed in `ADMIN_EMAILS`.
2. **Products & prices**: add real products with real prices (nothing is pre-filled).
3. **Bakers & restaurants**: add each baker's email. They sign in at `baker.rasvani.com`.
4. Orders appear live under **Orders**. Assign a baker, call the customer, move the status forward.

## Notes
- The older Supabase code (producer portal, warehouse, regional review) is retired; those routes return 404. It stays in git history and the `supabase/` folder.
- Payments: no online payment yet. Customers choose "pay on receipt" or "UPI after confirmation"; admin marks payment received.
