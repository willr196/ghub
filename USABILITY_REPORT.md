# GHUB Usability + Risk Review (Feb 5, 2026)

Scope: login, blog, image upload, and gym equipment/PBs. Findings focus on usability and discrepancies that can break functionality.

## High Impact
- Image upload is not implemented at all; gallery shows “Upload coming soon.”
  - File: `app/gallery/page.js`
- Gallery never renders actual media; it only shows emoji tiles and does not use `url`.
  - File: `app/gallery/page.js`
- Auth depends on Supabase env vars; missing/invalid values cause login and all auth flows to fail.
  - Files: `lib/supabase.js`, `components/AuthProvider.js`

## Medium Impact
- Schema defines `handle_new_user` and `on_auth_user_created` twice; this will fail on a clean DB setup.
  - File: `supabase/schema.sql`
- Blog is client-side only; if table/RLS not configured, user gets generic failures.
  - File: `app/blog/page.js`
- Registration redirects to `/login?registered=true`, but login page doesn’t show a success banner.
  - Files: `app/register/page.js`, `app/login/page.js`

## Low Impact / Polish
- Gallery doesn’t communicate visibility rules (public vs private).
  - File: `app/gallery/page.js`
- Blog has no draft/autosave.
  - File: `app/blog/page.js`

## Missing Features for Requested UX
- Seamless image upload requires:
  - Supabase Storage bucket + RLS for storage
  - Upload UI with drag/drop + progress
  - Insert into `gallery` table (url/type/category/is_public)
  - Render media via actual `url`
- “Login portal works” requires:
  - Supabase env vars set
  - Supabase Auth settings verified
- “Create your own blog” exists but requires Supabase + `blog_posts` + RLS
- Gym equipment + PBs requires:
  - New table(s) for equipment + PB history
  - UI to add equipment + PBs
  - New page or integration into Workouts/Library

## Proposed Next Steps
1. Implement gallery upload + render media (Supabase Storage + UI + DB insert).
2. Fix schema duplicate trigger/function.
3. Add a success banner to login after registration.
4. Design and implement equipment/PB feature + page.
