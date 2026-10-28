# ML Sportswear V3 — Quotation, Manual Payments & Tracking

**New version:** Read [UPGRADE-TO-V3.md](UPGRADE-TO-V3.md) first. It contains the Supabase migration and Windows VS Code update instructions. The V2 customizer remains included. `OFFLINE-DEMO-V2-ONLY.html` is a legacy design preview, not the V3 customer/payment flow.

Manual payments require actual business instructions and staff verification. The customer tracking link is a secret. No online payment gateway is connected.

---

# ML Sportswear Philippines – Website + Order Management

**Stack:** Next.js (App Router, TypeScript), Supabase (PostgreSQL, Authentication, private Storage), Vercel (hosting).

This is a working application source project for a customer-facing apparel customizer and a protected staff request dashboard. The design is a neat, responsive MVP inspired by the step-by-step options of buying an iPhone, not an imitation of Apple's visual identity.

## Main features

- Home page and garment catalog, including sando, T-shirt, shorts, jersey sets
- Live front/back graphic preview using responsive SVG garments
- Main garment, accent and text colors
- Optional front and back image uploads (PNG, JPG, WebP, up to 4 MB each)
- Team names, player names, jersey numbers and optional team roster
- Size breakdown (XS to 2XL), total quantity and demo price estimate
- Customer quotation inquiry with contact info
- Secure server API saves requests and artwork in Supabase
- Staff email/password login, restricted to authorized users
- Staff dashboard with search, status tracking and CSV export

**Important scope:** This is a *quotation request* system, not an integrated payment store, fabric simulation, print-ready design software, or real-time inventory system. No order should be produced or charged before the client confirms design and price. Example prices are DEMO placeholders, not official ML Sportswear pricing.

## 1. Open it in VS Code

1. Unzip `ML-Sportswear-NextJS.zip`.
2. Open the extracted `ml-sportswear` project folder in VS Code.
3. Open a Terminal inside the project.
4. Run:

```bash
npm install
npm run dev
```

5. Visit **http://localhost:3000** to explore the design.
6. Visit **http://localhost:3000/customize** to customize an item.

The customization interface loads without Supabase. To **save an order** or **sign in as staff**, complete the following Supabase steps.

## 2. Create and configure Supabase

1. Sign in at https://supabase.com/dashboard and create a new project.
2. In **SQL Editor**, choose **New query**.
3. Copy all contents of `supabase/schema.sql`, paste it into the editor, and click **Run**.
4. Confirm that `orders` and `admin_users` appear in **Table Editor**.
5. In **Storage**, confirm a PRIVATE bucket named `design-uploads` exists. SQL creates it for you. Do not make it public.
6. In **Project Settings > API Keys**, find the Project URL, publishable/anon key, and the secret service-role key.
7. In your project's root folder, copy `.env.example` to `.env.local` and replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
```

8. Stop and restart your Next.js server (`Ctrl+C`, then `npm run dev`).
9. Make a test quotation through **/customize**. You should see a success page with an `ML-...` reference number. Verify that a row appears in `orders` in Supabase.

**Secret-key safety:** `.env.local` is gitignored. NEVER paste your service-role key into client code, into the GitHub repo, or into any `NEXT_PUBLIC_...` variable. Only the server API uses that key.

## 3. Create a staff login

1. In Supabase, open **Authentication > Users**.
2. Select **Add user** and create a staff user with email and a strong password. The exact menu names may differ slightly in newer versions.
3. Copy that user's **UUID** (not the email).
4. Open Supabase **SQL Editor > New query** and run this *after replacing the UUID*:

```sql
insert into public.admin_users (id)
values ('PUT_YOUR_REAL_AUTH_USER_UUID_HERE');
```

5. Open **http://localhost:3000/admin** and sign in with that staff account. Only users listed in `admin_users` can view/manage requests.
6. Change a request's status, filter results and export CSV to test.

The staff API verifies each Supabase login token on the server before reading or changing private orders. Artwork links expire after 30 minutes.

## 4. Upload to GitHub and deploy on Vercel

1. Go to https://github.com/new and create a **private** repository named `ml-sportswear`.
2. From the VS Code terminal inside the project folder, run:

```bash
git init
git add .
git commit -m "Initial ML Sportswear customizer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ml-sportswear.git
git push -u origin main
```

3. If prompted, authenticate to GitHub through your existing Git credentials. Replace `YOUR_USERNAME` with yours.
4. Go to https://vercel.com/new and select **Import Git Repository**. Choose your `ml-sportswear` repo.
5. Keep **Framework Preset: Next.js** and leave Root Directory as `./`.
6. Under **Environment Variables**, add the same **three values** from `.env.local` for Production, then deploy.
7. When the deployment succeeds, Vercel will give you a shareable `https://....vercel.app` URL. Open it and submit a **test quotation**. Also verify `/admin` works for your authorized staff user.
8. To apply updates, edit in VS Code, then run `git add .`, `git commit -m "Update design"`, and `git push`.

The project's Vercel URL cannot be generated from this zip alone. The Vercel account owner must import/deploy it.

## 5. Important edits before using with real customers

- **Price list:** Edit `lib/catalog.ts` and change `price` values to *actual client-approved rates*. They are currently sample amounts. The backend uses that same price list to recompute totals.
- **Colors and garment types:** Edit `lib/catalog.ts` and matching garment choices in `lib/validation.ts` and SQL constraints if you add a type.
- **Contact and brand:** The logo is a temporary text-based ML mark. Replace it in `app/layout.tsx` with the client's approved official logo when supplied.
- **Sizing:** Verify the measurement guide and offered sizes with the client.
- **Print placement:** The preview is an approximation only, not a production-ready pattern.
- **Team roster:** The free-text roster lets a customer request different names/numbers. Staff should confirm it before production.
- **Delivery, payments, shipping and lead times:** Not implemented. Don't advertise fulfillment times without client input.
- **Data/privacy:** Customer contact information is private. Put a client-approved privacy notice on the public site and establish retention/deletion rules before production use.
- **Abuse protection:** Add proper bot detection/rate limiting (e.g. a CAPTCHA and server-side limit) before taking real internet traffic. The MVP uses a simple honeypot only.

## Light mode and dark mode

The website now has a **sun/moon theme button** in the top-right header on the home page, customizer, success page, and staff dashboard. Both modes use the same ML Sportswear design system.

- **Light mode:** icy blue-gray page background, white cards, deep navy text, cobalt highlights.
- **Dark mode:** midnight navy background, slate-blue cards, light text, periwinkle highlights.
- The first visit follows the device's light/dark preference. After the customer switches, the selection is saved in browser `localStorage` under `ml-sportswear-theme` and used on later visits.
- To change theme colors, edit the theme variables near the **end of `app/globals.css`**. The dark colors are inside `:root[data-theme="dark"]`.
- `components/ThemeToggle.tsx` contains the working toggle. The offline demo in `OFFLINE-DEMO.html` has the same feature and a separate client-side toggle.
- Theme preference is only visual. It does not change garment colors, prices, uploaded artwork, account permissions, or order data.

## 6. Tests to demonstrate in class

1. Open the website on desktop and mobile. Toggle light mode and dark mode and reload to confirm the selected mode is remembered.
2. Click Sando, choose base color, change trim and print colors.
3. Enter team name, player name and jersey number. Switch between Front and Back previews.
4. Upload a valid PNG logo. Check it appears in the preview.
5. Try an invalid file or a file larger than 4 MB. Confirm the form warns you.
6. Select sizes and quantities. Confirm the item count/estimate updates.
7. Enter customer information and submit. Verify a reference is shown and a row is in Supabase.
8. Log in to `/admin`, view the request, open uploaded artwork, update its status, and export CSV.
9. Verify an unauthorized login cannot open order data.
10. Confirm changes pushed to GitHub appear on the Vercel website.

## 7. Known technical limitations

- No multi-item cart. One garment/color configuration per request.
- No per-player interactive editor. Different player details are captured in the roster notes for staff confirmation.
- Colors/rendering are conceptual, and exact physical color reproduction is not guaranteed.
- No stock tracking, payment collection, notifications, automated quotation emailing or delivery integrations.
- Order API is public and requires rate limiting/CAPTCHA for production-grade abuse prevention.
- Admin dashboard shows latest 200 inquiries, not paginated historical archives.

## Update: interactive artwork editor

See **UPDATE-IN-VSCODE.md** for Windows replacement instructions and troubleshooting. The customization preview now supports pointer dragging, bottom-right resize handles, keyboard arrow/+/− shortcuts when an artwork element is focused, and an accessible layer selector plus movement/scale buttons. Separate front and back layout positions are included with submitted order data, in the `artwork_layout` JSONB column. Run the SQL migration in UPDATE-IN-VSCODE.md for existing databases.
