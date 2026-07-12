# 🚀 Mock Hub — Ultimate Redesign

Transform the current thin `/mocks` page into the #1 mock comparison destination for MBA aspirants. Apple-inspired premium UI, editable end-to-end, extensible to future exams (CMAT, MICAT, etc.).

## 1. Database (Lovable Cloud)

Replace the minimal `mocks` table with a richer schema:

**`mock_hub_entries`** — one row per mock/institute per exam
- `exam` (text: CAT/SNAP/NMAT/XAT/... — future-proof)
- `institute`, `mock_name`, `institute_logo_url`, `official_link`
- `price_inr` (numeric), `is_free` (bool), `free_mocks_count`, `total_mocks_count`
- `difficulty` (easy/moderate/actual-cat/above-cat)
- `exam_similarity_pct` (0-100)
- `overall_rating`, `question_quality`, `sectional_analysis`, `dashboard_experience`, `price_value` (all 0-10)
- `best_for` (text), `analysis_quality` (text)
- `pros` (text[]), `cons` (text[])
- `category_tags` (text[]: most-recommended, closest-to-exam, best-free, best-analytics, best-overall, newly-added)
- `featured_rank` (int, nullable — for Top 5 per exam)
- `is_sponsored` (bool, default false — transparency)
- `screenshots` (text[])

**`mock_hub_reviews`** — student ratings
- `mock_id` → mock_hub_entries, `user_id`, `stars` (1-5), `similarity_rating`, `difficulty`, `would_recommend` (bool), `comment`

RLS: entries readable by all (anon+auth); insert/update/delete admin-only via `has_role`. Reviews: anyone auth'd can insert own review, everyone can read, only author/admin can delete. Full GRANTs to anon (read entries+reviews) and authenticated.

## 2. Pages & Routes

- `/mocks` → **Mock Hub landing** (rename nav to "🚀 Mock Hub")
- `/mocks/:id` → **Mock Detail Page**
- `/admin` → add **Mock Hub Manager** tab with full CRUD form

Keep old `mocks` table + external platforms + ProAptitude in-app mocks section at the bottom (backward compatible).

## 3. Mock Hub Landing (`/mocks`)

**Hero:** headline, subheading, 4 CTA buttons (Explore CAT/SNAP/NMAT/XAT) that scroll+switch tab.

**Smart Recommendation Wizard** (collapsible card): 5 quick questions (exam, target %ile, budget, prep level, hours/day) → returns Top 5 mocks scored by fit.

**Tabs:** CAT | SNAP | NMAT | XAT (dynamic — driven by distinct `exam` values so new exams auto-appear).

**Per tab:**
- Featured strip: **Top 5** cards (by `featured_rank`)
- Category sections (chips + horizontal scroll): 🔥 Most Recommended · 💯 Closest to Exam · 💰 Best Free · 📈 Best Analytics · 🏆 Best Overall · 🆕 Newly Added
- **Smart Filters bar:** difficulty · price bucket · institute multi-select · search box
- **All mocks grid** — premium cards with logo, name, ⭐rating (X/10), price badge, similarity %, difficulty pill, best-for tag, pros/cons preview, "Visit Website" (external, `rel="noopener"`) + "View Details" buttons
- **Compare mode:** checkbox on each card → sticky "Compare (N)" bar → opens a table modal (Institute · Price · Free Mocks · Difficulty · Similarity · Solutions · Analytics · Question Quality · Best For · Student Rating)

## 4. Mock Detail Page (`/mocks/:id`)

Full page: hero (logo + name + rating), overview, pricing, features grid, screenshots carousel, pros/cons columns, "Who should buy this", exam similarity meter, student reviews list + submit-review form (auth-gated), Visit Website CTA, "Related Alternatives" (same exam, similar rating).

## 5. Admin Panel

New tab in `/admin`: **Mock Hub** — table view + add/edit dialog for every field listed above (multi-value fields use tag inputs), toggle `featured_rank`, category chips checkboxes, sponsored flag with visible warning. Delete with confirm.

## 6. Homepage Integration

Add a new section on `Home.tsx` between existing feature grid and next block: "🎯 Looking for the Best Mock Tests?" headline + subheading + gradient "Explore Mock Hub" button → `/mocks`.

## 7. UI / Design

Apple-inspired: rounded-2xl, backdrop-blur, subtle gradients from existing tokens, framer-motion stagger reveals, hover lifts, dark-mode-first. Icons via `lucide-react`. No hardcoded colors — semantic tokens only.

## 8. Transparency

- Every external link opens new tab with clear external-link icon
- Small caption under rankings: *"Rankings reflect Pro Aptitude editorial judgment based on transparent criteria. Sponsored entries (if any) are clearly labeled."*
- Sponsored rows get a visible "Sponsored" badge

## Technical details

- Migration creates `mock_hub_entries` + `mock_hub_reviews` with GRANTs, RLS, updated_at triggers.
- Seed: after migration approved, insert ~15 curated CAT/XAT/SNAP/NMAT entries (IMS, TIME, CL, Cracku, 2IIM, iQuanta, Hitbullseye, Oliveboard, Unacademy, Rodha) via insert tool.
- New files: `src/pages/MockHub.tsx`, `src/pages/MockDetail.tsx`, `src/components/mockhub/MockCard.tsx`, `MockCompareBar.tsx`, `MockFilters.tsx`, `MockRecommender.tsx`, `MockReviewSection.tsx`, `AdminMockHub.tsx`.
- Update: `App.tsx` routes, `Layout.tsx` nav label, `MockTests.tsx` → replaced with `MockHub`, `Home.tsx` new section, `AdminDashboard.tsx` new tab.
- Recommendation scoring: weighted sum (exam match ×∞, budget fit, difficulty vs prep-level, similarity %, rating) — client-side, no extra AI call needed.

Approve and I'll ship it end-to-end — migration first, then all UI + admin + homepage integration in one pass.
