# Install ML Sportswear V6 in your existing project

Use the **small V6 patch ZIP** if you already have the V4/V5 website running in VS Code. This preserves your `lib/catalog.ts` prices and `app/customize/page.tsx` checkout text changes. The full ZIP is available as a backup/reference.

1. Back up your entire `ml-sportswear` folder and stop the local dev server with `Ctrl+C`.
2. Download and extract **ML-Sportswear-V6-Cancel-Design-Patch.zip**.
3. Open the extracted folder and copy its **app**, **components** and **lib** folders into the **existing** `ml-sportswear` project folder. Allow Windows to merge folders and replace matching files. Do not create a second nested `ml-sportswear` folder.
4. **Do not touch** `.env.local`, `.git`, or `lib/catalog.ts`. The patch doesn't include them. If you have made your own changes to `app/globals.css`, save a copy first; the patch replaces this stylesheet to add the V6 design.
5. In VS Code's terminal (in the folder containing `package.json`):

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run dev
```

6. Open `/admin` and `/track` locally, and test cancellation on **new unpaid COD test orders**. An eligible order must be `cod_pending`, `not_started`, and `not_ready`.
7. If you're using the V5 customer account system, test signed-in `/account` order history too. If you never ran the V5 SQL update, run `supabase/UPGRADE-V5-CUSTOMER-ACCOUNTS.sql` once to enable customer order association. **Cancellation itself needs no new SQL.**
8. After local tests pass:

```powershell
git ls-files .env.local
git add .
git commit -m "Add buyer and admin cancellation with redesigned order center"
git push origin main
```

`git ls-files .env.local` must return nothing. Check Vercel → Deployments for **Ready** and refresh the public website.

### Where buttons appear

- **Admin:** `/admin` → select an order → Manage → Cancellation & order safety → Cancel this order.
- **Guest buyer:** open the private order tracking link → Need to change your order? → Cancel order.
- **Signed-in buyer:** `/account` → My Orders → Cancel order (on eligible orders).

A buyer must provide a reason and confirm the cancellation. The order stays in Supabase for audit/history, and both sides see a cancelled status. **No refund automation** is included; paid GCash or QR orders are excluded from automatic cancellation. The application does **not** send automatic emails.

### Tests/limitations

- Source syntax, local import checks, and core cancellation-condition/query tests passed.
- The full Next.js build and browser/Supabase tests could not be completed in this environment because npm dependencies were unavailable offline. Run `npm.cmd run build` and test in your own Supabase project before publishing.
