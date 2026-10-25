# ML Sportswear Philippines Customization and Quotation System

## Proposed purpose

Customers currently order through a marketplace where the business pays fees and may have limited ways to present custom sportswear options. This project is a web-based customization and inquiry system where customers can select garment styles, design preferences and sizes directly before requesting a quotation.

## Users

**Customer:** Select a garment, personalize it, preview it, upload artwork, enter quantity and contact information, and send a quotation request.

**Staff / owner:** Log in to a protected dashboard, review inquiries, view uploaded artwork, update inquiry status and export records.

## System boundaries

**Included:** Sando, shirts, shorts and jersey set requests; front/back garment preview; colors, artwork, team/player details; quantity by size; quotation inquiry; basic status tracking and reports.

**Not included:** Final order payment, shipping, real-time stock control, manufacturing workflow automation, official quotations and print-ready renderings.

## Customer process

Home → Choose garment → Select colors → Add names/numbers/logos → Select sizes → Review preview and estimated placeholder amount → Enter contact details → Send request → Receive reference → Staff review.

## Information stored

A Supabase PostgreSQL `orders` record contains a request code, garment, colors, names, numbers, team, size counts, quantity, notes, contact details, sample estimated total, private uploaded file paths, date and request status. `admin_users` stores the IDs of staff users authorized to view order data. Actual image files are stored in a private Supabase Storage bucket.

## Why it is more useful than a normal product catalog

Instead of simply displaying pre-made apparel listings, customers can configure colors and personalization and see a visual preview before sending the request. The information is saved in a structured database for staff review, reducing repeated questions about garment type, sizes and initial artwork preferences.

## Future improvements

Actual per-player personalization, size charts, repeat order support, automatic real quotations, inventory tracking, approved production timeline, notifications, online payments and shipping tools could be added after confirming client requirements.

## Visual design update

The customer-facing site, design studio, and staff pages have light and dark mode. Both themes use cohesive navy and blue palettes with readable surfaces. A sun/moon button saves the preference in the visitor’s browser, while the actual garment customization remains independent of the website theme.
