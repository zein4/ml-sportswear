# ML Sportswear V7 — Buyer Website, Google Sign-In, Phone OTP, and Privacy Notice

This V7 update builds on your working V6 project. **Use the small PATCH ZIP** to preserve your approved prices, checkout changes, payment settings, working admin and cancellation features.

## 1. Update VS Code (Windows)

1. Stop the Next.js terminal with `Ctrl + C` and back up the existing `ml-sportswear` folder.
2. Extract `ML-Sportswear-V7-Storefront-Accounts-PATCH.zip`.
3. Copy its `app`, `components`, and `lib` folders into your existing `ml-sportswear` folder. Merge and replace the matching files. **Do not delete** any other files. The patch includes the shared `lib/supabase-browser.ts` module that was accidentally missing from an older patch.
4. Do **not** replace or upload `.env.local`. Do not commit credentials.
5. In VS Code run:
   ```powershell
   npm.cmd install
   npm.cmd run build
   npm.cmd run dev
   ```
6. Check these pages: `/`, `/login`, `/signup`, `/privacy`, `/terms`, `/account`, `/customize`, `/track`, and `/admin`.

If the build fails, fix that specific error **before** pushing.

## 2. Supabase: database and existing email accounts

**No new V7 SQL** is needed. Your existing authentication uses Supabase Auth. If your project has **not** yet run the V5 upgrade `UPGRADE-V5-CUSTOMER-ACCOUNTS.sql`, run that script before testing `My Orders` with signed-in customers. Existing V6 cancellation and V4 COD features are unchanged.

Email/password login and signup should work with your existing Supabase Email provider. Your existing staff `/admin` login remains separate from customer membership.

## 3. Publish your Privacy Notice and Terms first

V7 adds public pages:
- `https://ml-sportswear-875h.vercel.app/privacy`
- `https://ml-sportswear-875h.vercel.app/terms`

**Owner review is required.** The pages are drafts. The shop must verify the actual business contact, retention schedule, delivery/refund policies, the service providers really used, and disclosures about customer information. Edit the text as needed to match real practices. The policy must not be presented as a final legally approved document without the owner's review.

Add your real support/privacy email to `.env.local` **and** Vercel Project → Settings → Environment Variables:
```
NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL=the-shop-real-email@domain.com
```
This is a public contact address, *not* a password or private key. Redeploy after editing Vercel variables. Do not keep a fake sample email. The page shows an owner-review warning if the email has not been configured.

Google may require the website home page and privacy policy to be public, linked in the OAuth consent screen, and on an authorized/verified domain. Owning a custom business domain is recommended for brand verification. See Google's current requirements at https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification .

## 4. Enable Continue with Google

1. Open Google Cloud at https://console.cloud.google.com/ and create or select a Google Cloud project for **ML Sportswear Philippines**.
2. In **Google Auth Platform**, configure **Branding** with the app name, an email for user support, and:
   - Homepage: `https://ml-sportswear-875h.vercel.app/`
   - Privacy Policy: `https://ml-sportswear-875h.vercel.app/privacy`
   - Terms: `https://ml-sportswear-875h.vercel.app/terms`
3. Configure **Audience** (External) and testing/publishing status appropriately. When in Testing, only test users can sign in.
4. Under **Clients**, create an **OAuth client** with type **Web application**.
5. Add **Authorized JavaScript origins**:
   - `https://ml-sportswear-875h.vercel.app`
   - `http://localhost:3000` (local testing)
6. In **Supabase → Authentication → Sign In / Providers → Google**, locate and copy the exact **Callback URL**. In Google Cloud's OAuth client, paste **that Supabase callback URL** under **Authorized redirect URIs**. It normally looks like `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` (NOT `/rest/v1` and NOT the Vercel `/account` URL).
7. Paste the Google **Client ID** and **Client Secret** into the **Supabase Google provider** settings. Enable Google and Save. **Do not paste the Google client secret into any NEXT_PUBLIC variable, frontend file, or GitHub**.
8. In **Supabase → Authentication → URL Configuration**, use the production site URL and add allowed redirects such as:
   - `https://ml-sportswear-875h.vercel.app/account`
   - `http://localhost:3000/account`
   - `https://ml-sportswear-875h.vercel.app/reset-password`
   - `http://localhost:3000/reset-password`
9. Open `/signup` or `/login` and click **Continue with Google**. A successful sign-in takes you to `/account` and does not grant staff permissions.

**Privacy Policy alone does not enable Google login.** The Google Cloud OAuth credentials, authorized callback, Supabase Google provider, and possible Google brand/domain verification are separate requirements. Google may request changes or verification before general availability.

Official guides:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/redirect-urls
- https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification

## 5. Enable Philippine mobile number OTP

1. Open Supabase → Authentication → Sign In / Providers → **Phone**.
2. Enable Phone sign-in **and configure an SMS provider** supported by Supabase (such as Twilio or Vonage). This may cost money and require a verified sender. **Do not turn on phone sign-in publicly until SMS delivery is reliable.**
3. Configure Supabase Auth rate limits and CAPTCHA/abuse protection before opening SMS sign-in to the public.
4. Open `/signup`, select **Phone number**, enter `09XXXXXXXXX` (converted to `+639XXXXXXXXX`), and click **Send SMS code**.
5. Enter the six-digit code from SMS, then click **Verify & continue**. The same OTP flow is available from `/login`.
6. When users sign in, subsequent orders placed while logged in can appear under `/account`. Orders made while logged out keep their private `/track` link and are not automatically associated with the new account.

**Important:** Phone OTP may automatically register a new Supabase Auth user during login. It does not require a password, and SMS sending requires a provider. It is **not** a free built-in SMS service.

Official guide: https://supabase.com/docs/guides/auth/phone-login

## 6. Deploy on your existing GitHub and Vercel

After all local build checks pass:
```powershell
git status
git ls-files .env.local
# Must produce NO OUTPUT for .env.local
git add app components lib
git commit -m "V7 buyer storefront Google and phone login privacy policy"
git push origin main
```

Vercel should deploy from `main`. Verify status **Ready**. **Do not** change your currently working Supabase or checkout variables. `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL` is the only new V7 environment variable.

## 7. Practical test checklist

- [ ] Homepage cards and dark/light theme display on desktop and phone
- [ ] `/privacy` and `/terms` publicly open without login
- [ ] Privacy contact email and policies confirmed by the shop
- [ ] Email/password signup and login work
- [ ] Google login works from a permitted test account
- [ ] Phone OTP works with real SMS provider or Supabase test number
- [ ] Customer `/account` loads signed-in orders
- [ ] Existing Admin login is staff-only
- [ ] V6 buyer/admin cancellation still works for eligible COD orders
- [ ] Current checkout and approved prices were not replaced

## Caution

Source files were syntax-checked, but a production Next.js build and Google/SMS end-to-end authentication couldn't be completed in this environment. Use the steps above and don't treat the integrations as active until their provider configuration and testing are complete. This privacy notice is a business-specific **draft**, not a legal compliance certification.
