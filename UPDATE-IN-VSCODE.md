# ML Sportswear V2 – Repair + Drag/Resize Editor

## Replace your old project safely (Windows)

1. In VS Code, stop your running website by pressing **Ctrl+C** in its terminal.
2. In Windows File Explorer, open `Documents\SD Project` (the folder shown in your screenshot).
3. **Rename** your current `ml-sportswear` folder to `ml-sportswear-backup`. Keep it until you have tested the new version.
4. Extract this ZIP into `Documents\SD Project`. It contains a new folder named `ml-sportswear`.
5. If you created `.env.local` in your OLD project, copy **only that file** from the backup into the new `ml-sportswear` folder. Never share that file or your Supabase service-role key.
6. In VS Code choose **File > Open Folder** and select the NEW `Documents\SD Project\ml-sportswear` folder (the folder containing `package.json`).
7. Choose **Terminal > New Terminal**. Using PowerShell, run these commands separately:

   npm.cmd install
   npm.cmd run dev

8. Open the **Local** address printed in the terminal (usually http://localhost:3000/customize).
9. Hard-refresh the browser with **Ctrl+Shift+R**. If you still see the old page, stop the server, delete the `.next` folder in the NEW project and run `npm.cmd run dev` again. Confirm that you are not viewing an old HTML demo or a previous Vercel deployment.

## Test the fixes

- Click **T-Shirt** and then **Sando**. The SVG silhouette should change.
- Select a different garment color. The preview should update immediately.
- Change the team name. The live preview should update.
- Click the team-name artwork **on the preview** and drag it.
- Drag the round resize handle at the bottom-right of the selected text or logo.
- Use the **Selected layer** menu, arrow buttons and +/− controls as an alternative to dragging.
- Switch to **Back view**. Move or resize the player's name and number independently.
- Choose a PNG, JPG or WebP (up to 4 MB). Click the uploaded logo and move/resize it. Use **Replace image** to swap it.
- Toggle light/dark mode; the choice should persist after refresh.
- Choose quantities to enable **Review & request quotation**.

### If the buttons still do not work

1. Open http://localhost:3000/customize in **Chrome or Edge**, NOT as a static file (`file://`) or as an image preview.
2. In Chrome/Edge press **F12 > Console**, check for red errors, and share a screenshot of BOTH the Console and VS Code terminal.
3. Verify that `npm.cmd run dev` is still running in the NEW project directory.

## Supabase upgrade (only when you are ready to submit real orders)

The new layout is sent to Supabase as `artwork_layout` JSON, with each layer's x, y and scale. In an existing Supabase project, open **SQL Editor** and execute:

```sql
alter table public.orders
  add column if not exists artwork_layout jsonb not null default '{}'::jsonb;
```

For a BRAND-NEW Supabase project, run the included `supabase/schema.sql` instead. The server will store layout placement alongside the uploaded original images. Staff can inspect the layout data and export it via CSV. **This is a mockup, not a print-ready file.** No actual website publishing or database connection is performed by unpacking the ZIP.

## Important

The Next.js customization page is the source of truth. Do not run `OFFLINE-DEMO.html` expecting it to connect to Supabase. The standalone HTML file is a browser-only demo.
