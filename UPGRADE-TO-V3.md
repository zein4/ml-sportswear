# ML Sportswear V3 — How to add the 7-step order flow

This upgrades your already-working Next.js + Supabase website. **DO NOT delete your Supabase project or recreate the tables.** Your existing orders and staff login remain there.

## A. Back up and update the project in VS Code (recommended for your existing GitHub setup)

1. In VS Code, stop Next.js with `Ctrl + C`.
2. In Windows File Explorer open `Documents\SD Project` (or wherever your project is saved).
3. **Copy** the entire existing `ml-sportswear` folder and rename the copy `ml-sportswear-v2-backup`. Keep the original `ml-sportswear` folder in place with its `.git` directory and `.env.local`.
4. Extract this ZIP to a separate folder such as `Downloads\ML-Sportswear-V3`. Inside it is a new `ml-sportswear` folder.
5. Copy all the **source files and folders** from that new V3 folder and paste them into your original `Documents\SD Project\ml-sportswear`. Choose **Replace** when asked to overwrite matching source files. Do **not** delete or overwrite `.git`, `.env.local`, or `node_modules` in the original project. The V3 ZIP intentionally does not contain those items.
6. In VS Code, open the original `ml-sportswear` project folder. Confirm you can see `UPGRADE-TO-V3.md` and `supabase/UPGRADE-V3.sql`.
7. In the terminal run:

   ```powershell
   npm.cmd install
   npm.cmd run build
   npm.cmd run dev
   ```

8. Use the local URL printed by the terminal (usually `http://localhost:3000`). If a previous server holds the port, stop it first; do not run two Next.js servers in the same project folder.

**Important:** Run the database upgrade in section B *before* you submit orders using V3. If `npm.cmd run build` fails, do not deploy yet; send the error for troubleshooting.

## B. Supabase — mandatory before testing V3

1. Open your **existing** ML Sportswear project at https://supabase.com/dashboard.
2. Open **SQL Editor → New query**.
3. In VS Code, open `supabase/UPGRADE-V3.sql` and copy its **entire contents**.
4. Paste them into Supabase SQL Editor and press **Run**.
5. Confirm success. Under Table Editor, verify a new table called **`order_payments`** appears.
6. Under Storage, verify a new **private** bucket named **`payment-proofs`** appears.
7. Existing `orders` and `admin_users` data must remain intact. Re-running the upgrade is designed to leave existing data in place.

**Do not run schema.sql again if your V2 tables already exist.** The upgrade adds fields and payment storage to your existing tables.

## C. What changed for the customer

1. On `/customize`, design a garment and submit the quotation request.
2. The success page displays a **private tracking link**. Copy/bookmark it. The link includes a secret and is only shown on submission.
3. Staff review designs at `/admin` and issue a final price and official business GCash/bank instructions.
4. Customer opens their private link at `/track`, refreshes, reviews the final quote, and clicks **I approve this quotation**.
5. Customer chooses GCash or bank transfer, chooses **deposit** or **full**, makes the transfer **outside this website**, and uploads a payment receipt.
6. The customer sees **Awaiting verification** until staff confirm funds actually arrived.
7. After staff verification, the customer can follow production and delivery. If a balance remains, they may upload proof of the final balance payment as well.

**This is manual payment tracking, NOT an online payment gateway.** No funds are automatically collected, refunded, or verified by the website. A proof image is not enough; staff must confirm the amount in the real business account.

## D. Staff portal workflow

Open `http://localhost:3000/admin` and sign in with the **existing staff login**.

1. Click **Manage** on an order.
2. Review design preview / order details, click **Mark reviewing** if desired.
3. Enter the **real final price**, down payment percentage (default 50%), quote terms, and the official GCash and/or bank transfer instructions. Click **Issue / update quotation**.
4. Ask the customer to check their private order link. This version does NOT send automatic emails, SMS or Messenger messages.
5. After the customer accepts and submits proof, open **Manage → Payment verification** and view the private receipt.
6. Check the actual GCash/bank balance independently. Only then click **Verify received payment**. Otherwise, **Reject proof**.
7. Update Production to **In production**, then **Ready**. Add courier tracking / pickup details under Delivery. A fully paid order can be marked **Shipped** and **Delivered**.
8. When the customer pays only the deposit, they must upload and have the remaining balance verified before the staff can mark the order as shipped or delivered.

### Existing V2 orders

Your V2 orders will remain visible but they **did not receive private tracking links**. For one of those, click **Manage → Create tracking link** and privately send the newly generated link to the customer. If an existing link is lost, **Replace lost tracking link** rotates the secret; the old link immediately stops working. Save or copy the newly created link before closing the panel. Do not post private links publicly.

## E. Update GitHub and Vercel

After section A, the original `ml-sportswear` folder still has your existing GitHub connection. Confirm `npm.cmd run build` succeeds, then run in VS Code:

```powershell
git status
git ls-files .env.local
```

`git ls-files .env.local` **must print nothing**. If it prints the file name, STOP because your Supabase secret could be pushed. Otherwise:

```powershell
git add .
git commit -m "Add quotation approval, manual payments and tracking"
git push origin main
```

Vercel normally deploys the new commit automatically if your GitHub repository is connected. Check Vercel → Deployments and wait for a **successful** build before sharing the link.

The **same three environment variables** from your working V2 configuration are used. Do not change or reveal `SUPABASE_SERVICE_ROLE_KEY`. If this is the first deployment, set them in Vercel → Project → Settings → Environment Variables (Production).

## F. Local testing checklist

1. New request appears in Supabase `orders` and at `/admin`.
2. Customer success screen offers a private tracking link. Copy it and open in a different browser/incognito window.
3. Staff issues quote: final amount and payment instructions appear in customer tracking view on Refresh.
4. Customer approves; staff can no longer change that quote.
5. Customer selects deposit or full, submits proof; a row appears in `order_payments`.
6. Admin verifies proof after independently checking money received; customer sees verified payment/balance.
7. Admin starts production. Customer sees the change after Refresh.
8. For deposit, customer submits second proof for balance; staff verifies it; only then can staff mark shipped/delivered.
9. Confirm unauthorized access to `/admin` cannot read customer orders.
10. Test light/dark modes, mobile view, and garment drag/resize editor still work.

## Production notes

- Configure a real privacy notice and retention/deletion procedure for receipts and personal details.
- Add rate limiting / CAPTCHA and monitoring before allowing open public customer uploads at scale. A basic honeypot is not sufficient abuse protection.
- Payment instructions are set by staff, not hard-coded, and should be verified out of band by the customer to prevent impersonation.
- There is no payment gateway integration, automated reconciliation, automatic refund, email/SMS notification, or verified shipping-carrier API in V3.
- Placeholders and demo price estimates on the design screen are not real business rates. Staff-set final quotes are the actual amounts customers approve.
- This code has passed static syntax checks; **a production Next.js build and full Supabase/browser test must be performed on your computer** before using it with real customers.
